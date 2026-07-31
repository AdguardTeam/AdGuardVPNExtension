/**
 * States of the popup app state machine.
 *
 * Each state represents a distinct phase in the popup lifecycle,
 * from initial load through authentication and onboarding to the fully rendered popup.
 */
export enum PopupState {
    /**
     * Initial state — popup just opened, nothing loaded yet.
     */
    Idle = 'idle',

    /**
     * Loading platform-specific data (Android detection, appearance theme).
     */
    LoadingPlatformData = 'loadingPlatformData',

    /**
     * Checking whether the user is authenticated.
     */
    LoadingAuthStatus = 'loadingAuthStatus',

    /**
     * User is not authenticated — showing the authentication screen.
     */
    ShowingAuthScreen = 'showingAuthScreen',

    /**
     * Loading startup data required for onboarding (flags, i18n, etc.).
     */
    LoadingStartupData = 'loadingStartupData',

    /**
     * User is going through onboarding screens
     * (Newsletter → Onboarding → UpgradeScreen).
     * Which exact screen to show is determined by MobX AuthStore computed properties.
     */
    ShowingOnboarding = 'showingOnboarding',

    /**
     * Loading full popup data (VPN info, locations, settings, etc.).
     */
    LoadingPopupData = 'loadingPopupData',

    /**
     * All data loaded — showing the full popup UI.
     */
    ShowingPopup = 'showingPopup',

    /**
     * An error occurred during data loading.
     */
    Error = 'error',
}

/**
 * Events that drive transitions in the popup app state machine.
 */
export enum PopupEvent {
    /**
     * Kick off initialization (sent on component mount).
     */
    Init = 'INIT',

    /**
     * User successfully authenticated (received from notifier).
     */
    UserAuthenticated = 'USER_AUTHENTICATED',

    /**
     * User logged out or token expired (received from notifier).
     * Transitions back to the authentication screen from any state.
     */
    UserDeauthenticated = 'USER_DEAUTHENTICATED',

    /**
     * Onboarding flow completed by the user.
     */
    OnboardingComplete = 'ONBOARDING_COMPLETE',

    /**
     * Retry the full initialization flow from the beginning after an error.
     */
    Retry = 'RETRY',

    /**
     * The derived active screen within the ShowingPopup state changed.
     *
     * Sent by a MobX reaction in App.tsx that mirrors store flags into the
     * machine context so the machine becomes the rendering authority.
     */
    ScreenChanged = 'SCREEN_CHANGED',
}

/**
 * Mutually-exclusive screens shown within the ShowingPopup lifecycle state.
 *
 * The active value is derived by {@link derivePopupScreen} from store flags
 * (in the documented priority order) and stored in the machine context so
 * that App.tsx renders purely from the machine state.
 */
export enum PopupScreen {
    /**
     * Default authenticated popup: header + settings + footer.
     */
    Main = 'main',

    /**
     * Browser has not granted host permissions (authenticated users only).
     */
    HostPermissionsError = 'hostPermissionsError',

    /**
     * Authenticated user but no locations were fetched.
     */
    NoLocationsError = 'noLocationsError',

    /**
     * Edge case: unauthenticated user reaching ShowingPopup
     * (e.g. logout during loading).
     */
    NotAuthenticated = 'notAuthenticated',

    /**
     * Global permissions error or another extension controls the proxy.
     */
    GlobalError = 'globalError',

    /**
     * Free-tier traffic limit exceeded (shown once until dismissed).
     */
    LimitExceeded = 'limitExceeded',

    /**
     * Locations selection screen.
     */
    Locations = 'locations',

    /**
     * Upgrade paywall shown to non-premium users
     * (forced, e.g. via the Stats menu item).
     */
    UpgradeScreen = 'upgradeScreen',

    /**
     * Stats screen (premium users only).
     */
    Stats = 'stats',

    /**
     * Profiles selection screen.
     */
    Profiles = 'profiles',
}

/**
 * Service names used by the popup app state machine's invoke configurations.
 */
export enum PopupService {
    /**
     * Loads platform-specific data (Android detection, appearance theme).
     */
    LoadPlatformData = 'loadPlatformData',

    /**
     * Checks whether the user is authenticated.
     */
    LoadAuthStatus = 'loadAuthStatus',

    /**
     * Loads startup data required for onboarding decisions.
     */
    LoadStartupData = 'loadStartupData',

    /**
     * Loads full popup data (stats, locations, settings, etc.).
     */
    LoadPopupData = 'loadPopupData',
}

/**
 * Guard names used by the popup app state machine for conditional transitions.
 */
export enum PopupGuard {
    /**
     * Checks whether the user is authenticated from the service result.
     */
    IsAuthenticated = 'isAuthenticated',

    /**
     * Checks whether onboarding screens should be shown from the service result.
     */
    ShouldShowOnboarding = 'shouldShowOnboarding',
}

/**
 * Machine context type for the popup app state machine.
 */
export interface PopupAppContext {
    /**
     * The currently active screen within the ShowingPopup state.
     * Updated via the ScreenChanged event by a MobX reaction in App.tsx.
     */
    screen: PopupScreen;
}

/**
 * Shape of the ScreenChanged event (carries the derived screen payload).
 */
export interface ScreenChangedEvent {
    type: typeof PopupEvent.ScreenChanged;
    screen: PopupScreen;
}

/**
 * Union of all event types the popup state machine accepts.
 *
 * Bare-string events (Init, UserAuthenticated, etc.) carry no payload.
 * {@link ScreenChangedEvent} carries the derived screen payload.
 */
export type PopupAppEvent =
    | typeof PopupEvent.Init
    | typeof PopupEvent.UserAuthenticated
    | typeof PopupEvent.UserDeauthenticated
    | typeof PopupEvent.OnboardingComplete
    | typeof PopupEvent.Retry
    | ScreenChangedEvent;
