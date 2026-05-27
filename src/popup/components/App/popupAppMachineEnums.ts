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
