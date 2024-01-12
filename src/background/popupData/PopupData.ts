import throttle from 'lodash/throttle';

import { Permissions } from '../../lib/permissions';
import { log } from '../../lib/logger';
import { connectivityService } from '../connectivity/connectivityService';
import { PromoNotificationData, promoNotifications } from '../promoNotifications';
import { auth } from '../auth';
import { settings } from '../settings';
import { SETTINGS_IDS } from '../../lib/constants';
import { sleep } from '../../lib/helpers';
import { vpnApi } from '../api';
import { updateService } from '../updateService';
import { flagsStorage } from '../flagsStorage';
import { exclusions } from '../exclusions';
import { rateModal } from '../rateModal';
import { EndpointsInterface } from '../endpoints/Endpoints';
import { PermissionsCheckerInterface } from '../permissionsChecker/PermissionsChecker';
import { PermissionsErrorInterface } from '../permissionsChecker/permissionsError';
import { CredentialsInterface } from '../credentials/Credentials';
import { NonRoutableServiceInterface } from '../routability/NonRoutableService';
import type { ConnectivityStateType } from '../schema';
import type { VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { isLocationsNumberAcceptable } from '../../common/is-locations-number-acceptable';
import { appStatus } from '../appStatus';
import { LocationWithPing } from '../endpoints/LocationWithPing';
import { CanControlProxy } from '../schema';
import { hintPopup } from '../hintPopup';
import { popupOpenedCounter } from './popupOpenedCounter';
import { emailService } from '../emailService/emailSevice';
import { abTestManager } from '../abTestManager';

interface PopupDataProps {
    permissionsChecker: PermissionsCheckerInterface;
    permissionsError: PermissionsErrorInterface;
    nonRoutable: NonRoutableServiceInterface;
    endpoints: EndpointsInterface;
    credentials: CredentialsInterface;
}

interface PopupDataInterface {
    permissionsError?: {
        message: string,
        status?: string,
    } | null;
    vpnInfo?: VpnExtensionInfoInterface | null;
    locations?: LocationWithPing[];
    selectedLocation?: LocationWithPing | null;
    isAuthenticated: string | boolean;
    policyAgreement: boolean;
    showScreenshotFlow: boolean;
    canControlProxy?: CanControlProxy;
    isProxyEnabled?: boolean;
    isRoutable?: boolean;
    isPremiumToken?: boolean;
    connectivityState?: {
        value: ConnectivityStateType,
    };
    promoNotification?: PromoNotificationData | null;
    desktopVpnEnabled?: boolean;
    isFirstRun?: boolean;
    flagsStorageData?: {
        [key: string]: string | boolean;
    }
    isVpnEnabledByUrl?: boolean;
    shouldShowRateModal?: boolean;
    username?: string | null;
    shouldShowHintPopup?: boolean;
    resendLinkCountDown?: number;
    isHostPermissionsGranted: boolean;

    /**
     * Flag that shows that all locations are not available. AG-25941.
     */
    isVpnBlocked?: boolean;
}

interface PopupDataRetry extends PopupDataInterface {
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

    getPopupData = async (url: string): Promise<PopupDataInterface> => {
        const isAuthenticated = await auth.isAuthenticated();
        const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);
        const showScreenshotFlow = await abTestManager.isShowScreenshotFlow();
        const isHostPermissionsGranted = await Permissions.hasNeededHostPermissions();

        if (!isAuthenticated) {
            return {
                isAuthenticated,
                policyAgreement,
                showScreenshotFlow,
                isHostPermissionsGranted,
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
        const connectivityState = { value: <ConnectivityStateType>connectivityService.state.value };
        const desktopVpnEnabled = await this.getDesktopEnabled();
        const promoNotification = await promoNotifications.getCurrentNotification();
        const { isFirstRun } = updateService;
        const flagsStorageData = await flagsStorage.getFlagsStorageData();
        const isVpnEnabledByUrl = exclusions.isVpnEnabledByUrl(url);
        const shouldShowRateModal = await rateModal.shouldShowRateModal();
        const username = await this.credentials.getUsername();
        const shouldShowHintPopup = await hintPopup.shouldShowHintPopup();

        // if got flag to request email confirmation,
        // have to start countdown for resend confirmation link
        if (vpnInfo?.emailConfirmationRequired) {
            emailService.startCountDown();
        }

        const { resendLinkCountDown } = emailService;

        // If error check permissions when popup is opened, ignoring multiple retries
        if (error) {
            throttledPermissionsChecker();
        }

        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;

        const isVpnBlocked = isLocationsNumberAcceptable(locations);

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
            shouldShowHintPopup,
            // FIXME: type
            resendLinkCountDown,
            showScreenshotFlow,
            isVpnBlocked,
            isHostPermissionsGranted,
        };
    };

    retryCounter = 0;

    DEFAULT_RETRY_DELAY = 400;

    async getPopupDataRetry(url: string, retryNum = 1, retryDelay = this.DEFAULT_RETRY_DELAY): Promise<PopupDataRetry> {
        const backoffIndex = 1.5;
        let data: PopupDataInterface;

        try {
            data = await this.getPopupData(url);
        } catch (e) {
            log.error(e);
            await sleep(retryDelay);
            this.retryCounter += 1;
            log.debug(`Retry get popup data again retry: ${this.retryCounter}`);
            return this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter += 1;

        // user is not authenticated
        if ((!data.isAuthenticated && data.policyAgreement !== undefined)
            || data.permissionsError) {
            this.retryCounter = 0;
            return { ...data, hasRequiredData: true };
        }

        let hasRequiredData = true;

        // check for required data.
        // NOTE: empty locations array case is handled separately due to AG-28164
        if (!data?.vpnInfo
            || !data?.selectedLocation) {
            if (retryNum <= 1) {
                // it may be useful to disconnect proxy if we can't get data
                if (data?.isProxyEnabled) {
                    await settings.disableProxy();
                }
                this.retryCounter = 0;
                hasRequiredData = false;
                return { ...data, hasRequiredData };
            }
            await sleep(retryDelay);
            log.debug(`Retry get popup data again retry: ${this.retryCounter}`);
            return this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter = 0;
        popupOpenedCounter.increment();
        return { ...data, hasRequiredData };
    }
}
