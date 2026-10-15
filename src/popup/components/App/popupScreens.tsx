import React from 'react';

import { type RootStore } from '../../stores/RootStore';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { Header } from '../Header';
import { InfoMessage, FeedbackMessage } from '../InfoMessage';
import { Locations } from '../Locations';
import { Authentication } from '../Authentication';
import { ExtraOptions } from '../ExtraOptions';
import { GlobalError } from '../GlobalError';
import { Settings } from '../Settings';
import { PromoNotificationModal } from '../PromoNotificationModal';
import { CurrentEndpoint } from '../Settings/CurrentEndpoint';
import { ExclusionsScreen } from '../Settings/ExclusionsScreen';
import { TrafficLimitExceeded } from '../Settings/TrafficLimitExceeded';
import { ConnectionsLimitError } from '../ConnectionsLimitError';
import { UpgradePaywall } from '../Authentication/UpgradeScreen';
import { ReviewPopup } from '../ReviewPopup';
import { VpnBlockedError } from '../VpnBlockedError';
import { HostPermissionsError } from '../HostPermissionsError';
import { NoLocationsError } from '../NoLocationsError';
import { LimitedOfferModal } from '../LimitedOfferModal';
import { MobileEdgePromo } from '../MobileEdgePromo';
import { Stats } from '../Stats';
import { ProfileToast } from '../Profiles/ProfileToast/ProfileToast';

import { PopupScreen } from './popupAppMachineEnums';

/**
 * Store dependencies the popup screen derivation reads from.
 *
 * The stores are passed as instances (not destructured primitives) so that a
 * MobX `reaction` can read their observable properties lazily and track them.
 * Uses `RootStore[...]` to keep the member types in sync with the real store
 * classes without importing them.
 */
export interface PopupScreenDeps {
    settingsStore: RootStore['settingsStore'];
    authStore: RootStore['authStore'];
    uiStore: RootStore['uiStore'];
    vpnStore: RootStore['vpnStore'];
    statsStore: RootStore['statsStore'];
}

/**
 * Derives the single active screen to render within the ShowingPopup lifecycle
 * state from the current store flags.
 *
 * The order encodes the exact priority that used to live in a chain of
 * parallel `if` blocks in App.tsx. It is the single source of truth for which
 * screen wins when several conditions are true at once
 * (e.g. a global error beats the locations screen).
 *
 * @param deps The store instances the flags are read from.
 * @returns The screen that should be rendered.
 */
export const derivePopupScreen = (deps: PopupScreenDeps): PopupScreen => {
    const {
        settingsStore,
        authStore,
        uiStore,
        vpnStore,
        statsStore,
    } = deps;

    const {
        canControlProxy,
        hasGlobalError,
        hasLimitExceededError,
        showLimitExceededScreen,
        isHostPermissionsGranted,
        freeUserClickedPremiumLocation,
    } = settingsStore;

    const { authenticated, renderUpgradeScreen } = authStore;
    const { isOpenLocationsScreen } = uiStore;
    const { isOpenStatsScreen } = statsStore;
    const {
        isPremiumToken,
        filteredLocations,
        notSearchingAndSavedTab,
    } = vpnStore;

    // show browser permission error after user is authenticated
    if (!isHostPermissionsGranted && authenticated) {
        return PopupScreen.HostPermissionsError;
    }

    // warn authenticated users if no locations were fetched. AG-28164
    if (authenticated
        && !hasGlobalError
        && notSearchingAndSavedTab
        && filteredLocations.length === 0) {
        return PopupScreen.NoLocationsError;
    }

    // Unauthenticated user reaching showingPopup (edge case: logout during loading)
    if (!authenticated && !hasGlobalError) {
        return PopupScreen.NotAuthenticated;
    }

    if ((hasGlobalError && !hasLimitExceededError) || !canControlProxy) {
        return PopupScreen.GlobalError;
    }

    if (showLimitExceededScreen) {
        return PopupScreen.LimitExceeded;
    }

    // A free user clicked a premium-only location (AG-57544): the paywall
    // replaces the locations screen, so it must be checked before it.
    // Keep separate from the onboarding upgrade check below, which
    // intentionally loses to the locations screen.
    if (!isPremiumToken && freeUserClickedPremiumLocation) {
        return PopupScreen.UpgradeScreen;
    }

    if (isOpenLocationsScreen) {
        return PopupScreen.Locations;
    }

    if (!isPremiumToken && renderUpgradeScreen) {
        return PopupScreen.UpgradeScreen;
    }

    if (isOpenStatsScreen) {
        return PopupScreen.Stats;
    }

    return PopupScreen.Main;
};

/**
 * Flag values the {@link renderPopupScreen} renderer reads for within-screen
 * sub-rendering. Passed explicitly (rather than reading stores) to keep the
 * renderer a pure function of its arguments: only the top-level screen is
 * decided by the machine context (see {@link derivePopupScreen}); the flags
 * below only affect what is rendered inside the chosen screen.
 */
export interface PopupScreenRenderFlags {
    authenticated: boolean;
    isOpenOptionsModal: boolean;
    shouldShowRegionNotice: boolean;
    isVpnBlocked: boolean;
    isLimitedOfferActive: boolean;
    isSiteExcluded: boolean;
    canControlProxy: boolean;
    premiumPromoEnabled: boolean | null;
}

/**
 * Renders the JSX for a single ShowingPopup screen.
 *
 * Only the top-level screen selection is machine-driven: which screen wins is
 * decided by the machine context (see {@link derivePopupScreen}). Once a screen
 * is chosen, this renderer still reads flag values to decide sub-rendering
 * details specific to that screen — e.g. the options modal
 * (`isOpenOptionsModal`), VPN-blocked /region warnings and the limited-offer
 * modal (`isVpnBlocked`, `shouldShowRegionNotice`, `isLimitedOfferActive`),
 * exclusions vs. settings (`isSiteExcluded`) and the footer message
 * (`premiumPromoEnabled`). Those flags do not change which screen is active,
 * only what is rendered inside it.
 *
 * `Icons` and `ServerErrorPopup` are intentionally not rendered here: they are
 * lifted to the single top-level return in {@link App} so they render exactly
 * once for every non-null popup state.
 *
 * @param screen The active screen to render.
 * @param flags Flag values needed for within-screen sub-rendering.
 * @returns The screen's JSX.
 */
export const renderPopupScreen = (
    screen: PopupScreen,
    flags: PopupScreenRenderFlags,
): React.ReactNode => {
    const {
        authenticated,
        isOpenOptionsModal,
        shouldShowRegionNotice,
        isVpnBlocked,
        isLimitedOfferActive,
        isSiteExcluded,
        canControlProxy,
        premiumPromoEnabled,
    } = flags;

    switch (screen) {
        case PopupScreen.HostPermissionsError: {
            return <HostPermissionsError />;
        }

        case PopupScreen.NoLocationsError: {
            return <NoLocationsError />;
        }

        case PopupScreen.NotAuthenticated: {
            return <Authentication />;
        }

        case PopupScreen.GlobalError: {
            const showMenuButton = authenticated && canControlProxy;
            // Screen name can be null if the error is not related to the control of the proxy.
            const screenName = !canControlProxy
                ? TelemetryScreenName.DisableAnotherVpnExtensionScreen
                : null;

            return (
                <>
                    {isOpenOptionsModal && <ExtraOptions />}
                    <Header showMenuButton={showMenuButton} screenName={screenName} />
                    {
                        // do not show the warning if there is a limited offer active
                        !isLimitedOfferActive && <VpnBlockedError />
                    }
                    <GlobalError />
                </>
            );
        }

        case PopupScreen.LimitExceeded: {
            return <TrafficLimitExceeded />;
        }

        case PopupScreen.Locations: {
            return <Locations />;
        }

        case PopupScreen.UpgradeScreen: {
            return <UpgradePaywall />;
        }

        case PopupScreen.Stats: {
            return <Stats />;
        }

        case PopupScreen.Main:
        default: {
            return (
                <>
                    <ConnectionsLimitError />
                    <PromoNotificationModal />
                    <ProfileToast />
                    {isOpenOptionsModal && <ExtraOptions />}
                    <MobileEdgePromo />
                    <Header showMenuButton={authenticated} />
                    {
                        (shouldShowRegionNotice || isVpnBlocked)
                        // do not show the warning if there is a limited offer active
                        && !isLimitedOfferActive
                        && <VpnBlockedError />
                    }
                    {
                        isLimitedOfferActive
                        && <LimitedOfferModal />
                    }
                    {isSiteExcluded
                        ? <ExclusionsScreen />
                        : (
                            <>
                                <Settings />
                                <div className="footer">
                                    {premiumPromoEnabled ? (
                                        <InfoMessage />
                                    ) : (
                                        <FeedbackMessage />
                                    )}
                                    <CurrentEndpoint />
                                </div>
                            </>
                        )}
                    <ReviewPopup />
                </>
            );
        }
    }
};
