import { type ProfileInfo } from '../schema/profiles/profile';
import { type PromoNotificationData } from '../promoNotifications';
import type { ConnectivityStateType } from '../../common/connectivityState';
import type { CanControlProxy } from '../schema';
import { type VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { type LocationWithPing } from '../endpoints/LocationWithPing';
import { type LocationsTab } from '../endpoints/locationsEnums';
import { type VariantCache } from '../abTestManager/ABTestManager';
import { type FlagsStorageData } from '../flagsStorageData';
import { type LocalePreference } from '../../common/locale';

/**
 * Data returned by the popup data fetcher.
 *
 * Fields that are only populated when the user is authenticated are
 * marked optional so the unauthenticated response (which omits them)
 * satisfies the same type.
 *
 * @see AuthenticatedPopupData for narrowed variant with all fields required.
 */
export interface PopupDataInterface {
    /**
     * Error related to missing or insufficient permissions.
     */
    permissionsError?: {
        message: string,
        status?: string,
    } | null;

    /**
     * VPN extension info such as subscription status and limits.
     */
    vpnInfo?: VpnExtensionInfoInterface | null;

    /**
     * List of available VPN locations with ping data.
     */
    locations?: LocationWithPing[];

    /**
     * Currently selected VPN location.
     */
    selectedLocation?: LocationWithPing | null;

    /**
     * Domain used for traffic forwarding.
     */
    forwarderDomain: string;

    /**
     * User authentication status. String value indicates an access token.
     */
    isAuthenticated: string | boolean;

    /**
     * User's acceptance of the privacy policy.
     */
    policyAgreement: boolean;

    /**
     * User's opt-in to send telemetry.
     */
    helpUsImprove: boolean;

    /**
     * Extension's ability to control the proxy settings.
     */
    canControlProxy?: CanControlProxy;

    /**
     * Proxy enabled state.
     */
    isProxyEnabled?: boolean;

    /**
     * Routable state of the current network through the VPN.
     */
    isRoutable?: boolean;

    /**
     * Premium subscription token presence.
     */
    isPremiumToken?: boolean;

    /**
     * Current connectivity state of the VPN connection.
     */
    connectivityState?: {
        value: ConnectivityStateType,
    };

    /**
     * Active promo notification to display, if any.
     */
    promoNotification?: PromoNotificationData | null;

    /**
     * First run after installation flag.
     */
    isFirstRun?: boolean;

    /**
     * Feature flags storage data.
     */
    flagsStorageData?: FlagsStorageData;

    /**
     * VPN enabled state for the current URL.
     */
    isVpnEnabledByUrl?: boolean;

    /**
     * Rate-the-extension modal visibility flag.
     */
    shouldShowRateModal?: boolean;

    /**
     * Mobile Edge promo banner visibility flag.
     */
    shouldShowMobileEdgePromoBanner?: boolean;

    /**
     * Authenticated user's username.
     */
    username?: string | null;

    /**
     * Onboarding hint popup visibility flag.
     */
    shouldShowHintPopup?: boolean;

    /**
     * Host permissions granted state.
     */
    isHostPermissionsGranted: boolean;

    /**
     * Flag that shows that all locations are not available. AG-25941.
     */
    isVpnBlocked?: boolean;

    /**
     * Flag indicating if region-specific notice should be shown.
     */
    shouldShowRegionNotice?: boolean;

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
     * User's selected language preference.
     */
    selectedLanguage: LocalePreference;

    /**
     * Cached A/B experiment variant assignments.
     */
    experimentVariants?: VariantCache;

    /**
     * Active profile ID.
     */
    activeProfileId: string;

    /**
     * List of all profiles (id + name only).
     */
    profiles: ProfileInfo[];

    /**
     * The profile ID being switched to, or `null` when no switch
     * is in progress.
     */
    switchingProfileId: string | null;
}

/**
 * Narrowed popup data variant where the user is authenticated and all
 * fields are guaranteed to be present (not optional).
 */
export type AuthenticatedPopupData = Required<PopupDataInterface>;

/**
 * Popup data enriched with a flag indicating whether all required data
 * was successfully fetched.
 */
export interface PopupDataRetry extends PopupDataInterface {
    hasRequiredData: boolean;
}

/**
 * Authenticated popup data with retry metadata.
 */
export type AuthenticatedPopupDataRetry = AuthenticatedPopupData & {
    hasRequiredData: boolean;
};
