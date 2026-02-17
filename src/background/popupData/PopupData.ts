import throttle from 'lodash/throttle';

import { Permissions } from '../../common/permissions';
import { log } from '../../common/logger';
import { connectivityService } from '../connectivity/connectivityService';
import { type PromoNotificationData, promoNotifications } from '../promoNotifications';
import { auth } from '../auth';
import { settings } from '../settings';
import { SETTINGS_IDS } from '../../common/constants';
import { type LocalePreference } from '../../common/locale';
import { sleep } from '../../common/helpers';
import { updateService } from '../updateService';
import { flagsStorage } from '../flagsStorage';
import { exclusions } from '../exclusions';
import { forwarder } from '../forwarder';
import { rateModal } from '../rateModal';
import { mobileEdgePromoService } from '../mobileEdgePromoService';
import { type EndpointsInterface } from '../endpoints/Endpoints';
import { type PermissionsCheckerInterface } from '../permissionsChecker/PermissionsChecker';
import { type PermissionsErrorInterface } from '../permissionsChecker/permissionsError';
import { type CredentialsInterface } from '../credentials/Credentials';
import { type NonRoutableServiceInterface } from '../routability/NonRoutableService';
import type { ConnectivityStateType, CanControlProxy } from '../schema';
import { type VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { isLocationsNumberAcceptable } from '../../common/is-locations-number-acceptable';
import { appStatus } from '../appStatus';
import { type LocationWithPing } from '../endpoints/LocationWithPing';
import { hintPopup } from '../hintPopup';
import { savedLocations } from '../savedLocations';
import { locationsService } from '../endpoints/locationsService';
import { type LocationsTab } from '../endpoints/locationsEnums';
import { abTestManager } from '../abTestManager';

import { popupOpenedCounter } from './popupOpenedCounter';

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
    forwarderDomain: string;
    isAuthenticated: string | boolean;
    policyAgreement: boolean;
    helpUsImprove: boolean;
    canControlProxy?: CanControlProxy;
    isProxyEnabled?: boolean;
    isRoutable?: boolean;
    isPremiumToken?: boolean;
    connectivityState?: {
        value: ConnectivityStateType,
    };
    promoNotification?: PromoNotificationData | null;
    isFirstRun?: boolean;
    flagsStorageData?: {
        [key: string]: string | boolean;
    }
    isVpnEnabledByUrl?: boolean;
    shouldShowRateModal?: boolean;
    shouldShowMobileEdgePromoBanner?: boolean;
    username?: string | null;
    shouldShowHintPopup?: boolean;
    isHostPermissionsGranted: boolean;

    /**
     * Flag that shows that all locations are not available. AG-25941.
     */
    isVpnBlocked?: boolean;

    /**
     * Locations tab.
     */
    locationsTab: LocationsTab;

    /**
     * Saved location IDs.
     */
    savedLocationIds: string[];

    /**
     * User decision on marketing consent or `null` if not available.
     */
    marketingConsent?: boolean | null;

    /**
     * Whether we should show streaming label text.
     * Present only if user is authenticated.
     * Part of AG-47804 AB test task.
     */
    shouldShowStreamingLabelText?: boolean;

    /**
     * Streaming text experiment value to send with telemetry event for AG-47804 task.
     */
    streamingTextExperimentValue?: string | null;

    /**
     * User's selected language preference.
     */
    selectedLanguage: LocalePreference;
}

export interface PopupDataRetry extends PopupDataInterface {
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

    getPopupData = async (url: string | null): Promise<PopupDataInterface> => {
        const isAuthenticated = await auth.isAuthenticated();
        const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);
        const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
        const isHostPermissionsGranted = await Permissions.hasNeededHostPermissions();
        const forwarderDomain = await forwarder.updateAndGetDomain();
        const locationsTab = await locationsService.getLocationsTab();
        const savedLocationIds = await savedLocations.getSavedLocationIds();

        const selectedLanguage = settings.getSelectedLanguage();

        if (!isAuthenticated) {
            return {
                forwarderDomain,
                isAuthenticated,
                policyAgreement,
                helpUsImprove,
                isHostPermissionsGranted,
                locationsTab,
                savedLocationIds,
                selectedLanguage,
            };
        }

        const throttledPermissionsChecker = throttle(
            this.permissionsChecker.checkPermissions,
            2000,
        );

        const error = this.permissionsError.getError();
        const isRoutable = this.nonRoutable.isUrlRoutable(url);
        const vpnInfo = await this.endpoints.getVpnInfo();
        const locations = await this.endpoints.getLocations();
        const selectedLocation = await this.endpoints.getSelectedLocation();
        const canControlProxy = await appStatus.canControlProxy();
        const isProxyEnabled = settings.isProxyEnabled();
        const isPremiumToken = await this.credentials.isPremiumToken();
        const connectivityState = { value: <ConnectivityStateType>connectivityService.state.value };
        const promoNotification = await promoNotifications.getCurrentNotification();
        const { isFirstRun } = updateService;
        const flagsStorageData = await flagsStorage.getFlagsStorageData();
        const isVpnEnabledByUrl = await exclusions.isVpnEnabledByUrl(url);
        const shouldShowRateModal = rateModal.shouldShowRateModal();
        const username = await this.credentials.getUsername();
        const shouldShowHintPopup = await hintPopup.shouldShowHintPopup();
        const shouldShowMobileEdgePromoBanner = await mobileEdgePromoService.shouldShowBanner();
        const marketingConsent = await this.credentials.getMarketingConsent();
        const shouldShowStreamingLabelText = await abTestManager.isShowStreamingLabelText();
        const streamingTextExperimentValue = await abTestManager.getStreamingTextExperiment();

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
            forwarderDomain,
            isAuthenticated,
            policyAgreement,
            helpUsImprove,
            canControlProxy,
            isProxyEnabled,
            isRoutable,
            isPremiumToken,
            connectivityState,
            promoNotification,
            isFirstRun,
            flagsStorageData,
            isVpnEnabledByUrl,
            shouldShowRateModal,
            shouldShowMobileEdgePromoBanner,
            username,
            shouldShowHintPopup,
            isVpnBlocked,
            isHostPermissionsGranted,
            locationsTab,
            savedLocationIds,
            marketingConsent,
            shouldShowStreamingLabelText,
            streamingTextExperimentValue,
            selectedLanguage,
        };
    };

    retryCounter = 0;

    DEFAULT_RETRY_DELAY = 400;

    async getPopupDataRetry(
        url: string | null,
        retryNum = 1,
        retryDelay = this.DEFAULT_RETRY_DELAY,
    ): Promise<PopupDataRetry> {
        const backoffIndex = 1.5;
        let data: PopupDataInterface;

        try {
            data = await this.getPopupData(url);
        } catch (e) {
            log.error('[vpn.PopupData.getPopupDataRetry]: ', e);
            await sleep(retryDelay);
            this.retryCounter += 1;
            log.debug(`[vpn.PopupData.getPopupDataRetry]: Retry get popup data again retry: ${this.retryCounter}`);
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
            log.debug(`[vpn.PopupData.getPopupDataRetry]: Retry get popup data again retry: ${this.retryCounter}`);
            return this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter = 0;
        await popupOpenedCounter.increment();
        return { ...data, hasRequiredData };
    }
}
