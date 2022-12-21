import throttle from 'lodash/throttle';
import isEmpty from 'lodash/isEmpty';
import { StateValue } from 'xstate/lib/types';

import { log } from '../../lib/logger';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { PromoNotificationData, promoNotifications } from '../promoNotifications';
import auth from '../auth';
import { settings } from '../settings';
import { SETTINGS_IDS } from '../../lib/constants';
import { sleep } from '../../lib/helpers';
import { vpnApi } from '../api';
import { updateService } from '../updateService';
import { flagsStorage } from '../flagsStorage';
import { exclusions } from '../exclusions';
import { rateModal } from '../rateModal';
import { credentials } from '../credentials';
import { EndpointsInterface } from '../endpoints/Endpoints';
import { PermissionsCheckerInterface } from '../permissionsChecker/PermissionsChecker';
import { PermissionsErrorInterface } from '../permissionsChecker/permissionsError';
import { CredentialsInterface } from '../credentials/Credentials';
import { NonRoutableServiceInterface } from '../routability/NonRoutableService';
import { VpnExtensionInfoInterface } from '../providers/vpnProvider';
import { appStatus } from '../appStatus';
import { LocationWithPing } from '../endpoints/LocationWithPing';
import { CanControlProxy } from '../proxy/proxy';

interface PopupDataProps {
    permissionsChecker: PermissionsCheckerInterface;
    permissionsError: PermissionsErrorInterface;
    nonRoutable: NonRoutableServiceInterface;
    endpoints: EndpointsInterface;
    credentials: CredentialsInterface;
}

interface PopupDataFull {
    permissionsError: {
        message: string,
        status: string,
    } | null;
    vpnInfo: VpnExtensionInfoInterface | null;
    locations: LocationWithPing[];
    selectedLocation: LocationWithPing | null;
    isAuthenticated: string | boolean;
    policyAgreement: boolean;
    canControlProxy: CanControlProxy;
    isProxyEnabled: boolean;
    isRoutable: boolean;
    isPremiumToken: boolean;
    connectivityState: StateValue;
    promoNotification: PromoNotificationData | null;
    desktopVpnEnabled: boolean;
    isFirstRun?: boolean;
    flagsStorageData: {
        [key: string]: string | boolean;
    }
    isVpnEnabledByUrl: boolean;
    shouldShowRateModal: boolean;
    username: string | null;
}

interface PopupDataNotAuthenticated {
    isAuthenticated: string | boolean;
    policyAgreement: boolean;
}

interface PopupDataRetry extends PopupDataFull {
    hasRequiredData: boolean;
}

export class PopupData {
    private permissionsChecker: PermissionsCheckerInterface;

    private permissionsError: PermissionsErrorInterface;

    private nonRoutable: NonRoutableServiceInterface;

    private endpoints: EndpointsInterface;

    private credentials: CredentialsInterface;

    constructor({
        permissionsChecker,
        permissionsError,
        nonRoutable,
        endpoints,
        credentials,
    }: PopupDataProps) {
        this.permissionsChecker = permissionsChecker;
        this.permissionsError = permissionsError;
        this.nonRoutable = nonRoutable;
        this.endpoints = endpoints;
        this.credentials = credentials;
    }

    async getDesktopEnabled() {
        let { desktopVpnEnabled } = connectivityService.state.context;
        if (desktopVpnEnabled) {
            const desktopVpnConnection = await vpnApi.getDesktopVpnConnectionStatus();
            desktopVpnEnabled = !!desktopVpnConnection.connected;
        }
        return desktopVpnEnabled;
    }

    getPopupData = async (url: string): Promise<PopupDataFull | PopupDataNotAuthenticated> => {
        const isAuthenticated = await auth.isAuthenticated();
        const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);

        if (!isAuthenticated) {
            return {
                isAuthenticated,
                policyAgreement,
            };
        }

        const throttledPermissionsChecker = throttle(
            this.permissionsChecker.checkPermissions,
            2000,
        );

        const error = this.permissionsError.getError();
        const isRoutable = this.nonRoutable.isUrlRoutable(url);
        const vpnInfo = await this.endpoints.getVpnInfo();
        const locations = this.endpoints.getLocations();
        const selectedLocation = await this.endpoints.getSelectedLocation();
        const canControlProxy = await appStatus.canControlProxy();
        const isProxyEnabled = settings.isProxyEnabled();
        const isPremiumToken = await this.credentials.isPremiumToken();
        const connectivityState = { value: connectivityService.state.value };
        const desktopVpnEnabled = await this.getDesktopEnabled();
        const promoNotification = await promoNotifications.getCurrentNotification();
        const { isFirstRun } = updateService;
        const flagsStorageData = await flagsStorage.getFlagsStorageData();
        const isVpnEnabledByUrl = exclusions.isVpnEnabledByUrl(url);
        const shouldShowRateModal = await rateModal.shouldShowRateModal();
        const username = await credentials.getUsername();

        // If error check permissions when popup is opened, ignoring multiple retries
        if (error) {
            throttledPermissionsChecker();
        }

        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;

        return {
            // Firefox can't message to the popup error instance,
            // that's why we convert it to the simpler object
            permissionsError: simplifiedError,
            vpnInfo,
            locations,
            selectedLocation,
            isAuthenticated,
            policyAgreement,
            canControlProxy,
            isProxyEnabled,
            isRoutable,
            isPremiumToken,
            connectivityState,
            promoNotification,
            desktopVpnEnabled,
            isFirstRun,
            flagsStorageData,
            isVpnEnabledByUrl,
            shouldShowRateModal,
            username,
        };
    };

    retryCounter = 0;

    DEFAULT_RETRY_DELAY = 400;

    async getPopupDataRetry(url: string, retryNum = 1, retryDelay = this.DEFAULT_RETRY_DELAY): Promise<PopupDataRetry> {
        const backoffIndex = 1.5;
        let data: PopupDataFull | PopupDataNotAuthenticated = {
            isAuthenticated: false,
            policyAgreement: false,
        };

        try {
            data = await this.getPopupData(url);
        } catch (e: any) {
            log.error(e);
        }

        this.retryCounter += 1;

        if (!data?.isAuthenticated || (data as PopupDataFull).permissionsError) {
            this.retryCounter = 0;
            return { ...data, hasRequiredData: true } as PopupDataRetry;
        }

        const { vpnInfo, locations, selectedLocation } = data as PopupDataFull;

        let hasRequiredData = true;

        if (!vpnInfo || isEmpty(locations) || !selectedLocation) {
            if (retryNum <= 1) {
                // it may be useful to disconnect proxy if we can't get data
                if ((data as PopupDataFull)?.isProxyEnabled) {
                    await settings.disableProxy();
                }
                this.retryCounter = 0;
                hasRequiredData = false;
                return { ...data, hasRequiredData } as PopupDataRetry;
            }
            await sleep(retryDelay);
            log.debug(`Retry get popup data again retry: ${this.retryCounter}`);
            return this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter = 0;
        return { ...data as PopupDataFull, hasRequiredData };
    }
}
