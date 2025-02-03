/**
 * Screen names passed to telemetry.
 */
export enum TelemetryScreenName {
    WelcomeScreen = 'welcome_screen',
    PurchaseScreen = 'purchase_screen',
    // FIXME: Add rest of screen names
}

/**
 * Event names passed to telemetry.
 */
export enum TelemetryActionName {
    OnboardingPurchaseClick = 'onboarding_purchase_click',
    OnboardingStayFreeClick = 'onboarding_stay_free_click',
    // FIXME: Add rest of action names
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
