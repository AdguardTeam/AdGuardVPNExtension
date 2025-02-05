/**
 * Screen names passed to telemetry.
 *
 * FIXME: Add rest of screen names
 */
export enum TelemetryScreenName {
    // Popup screens
    WelcomeScreen = 'welcome_screen',
    PurchaseScreen = 'purchase_screen',

    // Options screens
    FreeGbScreen = 'free_gb_screen',
    FreeGbInviteFriendScreen = 'free_gb_invite_friend_screen',
    FreeGbConfirmEmailScreen = 'free_gb_confirm_email_screen',
    FreeGbAddAnotherPlatformScreen = 'free_gb_add_another_platform_screen',
    DialogExclusionsAddSubdomain = 'dialog_exclusions_add_subdomain',
}

/**
 * Event names passed to telemetry.
 *
 * FIXME: Add rest of action names
 */
export enum TelemetryActionName {
    // Popup actions
    OnboardingPurchaseClick = 'onboarding_purchase_click',
    OnboardingStayFreeClick = 'onboarding_stay_free_click',

    // Options actions
}

/**
 * Operating system names passed to telemetry.
 */
export enum TelemetryOs {
    MacOS = 'Mac',
    iOS = 'iOS',
    Windows = 'Windows',
    Android = 'Android',
    ChromeOS = 'ChromeOS',
    Linux = 'Linux',
    OpenBSD = 'OpenBSD',
    Fuchsia = 'Fuchsia',
}

/**
 * License status names passed to telemetry.
 */
export enum TelemetryLicenseStatus {
    Free = 'FREE',
    Premium = 'PREMIUM',
}

/**
 * Subscription duration names passed to telemetry.
 */
export enum TelemetrySubscriptionDuration {
    Monthly = 'MONTHLY',
    Annual = 'ANNUAL',
    Lifetime = 'LIFETIME',
    Other = 'OTHER',
}

/**
 * UI theme names passed to telemetry.
 */
export enum TelemetryTheme {
    Light = 'LIGHT',
    Dark = 'DARK',
    System = 'SYSTEM',
}
