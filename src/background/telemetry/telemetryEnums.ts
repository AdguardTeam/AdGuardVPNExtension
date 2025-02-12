/**
 * Screen names passed to telemetry.
 */
export enum TelemetryScreenName {
    // Popup screens
    WelcomeScreen = 'welcome_screen',
    AuthScreen = 'auth_screen',
    AuthLoginScreen = 'auth_login_screen',
    AuthSignupScreen = 'auth_signup_screen',
    NewsletterScreen = 'newsletter_screen',
    OnboardingScreen = 'onboarding_screen',
    PurchaseScreen = 'purchase_screen',
    PromoOfferScreen = 'promo_offer_screen',
    HomeScreen = 'home_screen',
    DisableAnotherVpnExtensionScreen = 'disable_another_vpn_extension_screen',
    SpeedReducedScreen = 'speed_reduced_screen',
    MenuScreen = 'menu_screen',
    LocationsScreen = 'locations_screen',
    DeviceLimitScreen = 'device_limit_screen',
    DialogDesktopVersionPromo = 'dialog_desktop_version_promo',
    DialogAccessWebsitesPermission = 'dialog_access_websites_permission',

    // Options screens
    SettingsScreen = 'settings_screen',
    SettingsDnsServersScreen = 'settings_dns_servers_screen',
    DialogAddCustomDns = 'dialog_add_custom_dns',
    DialogEditCustomDns = 'dialog_edit_custom_dns',
    FreeGbScreen = 'free_gb_screen',
    FreeGbInviteFriendScreen = 'free_gb_invite_friend_screen',
    FreeGbConfirmEmailScreen = 'free_gb_confirm_email_screen',
    FreeGbAddAnotherPlatformScreen = 'free_gb_add_another_platform_screen',
    AccountScreen = 'account_screen',
    LoggedOutScreen = 'logged_out_screen',
    SupportScreen = 'support_screen',
    SupportReportBugScreen = 'support_report_bug_screen',
    AboutScreen = 'about_screen',
    ExclusionsScreen = 'exclusions_screen',
    DialogExclusionsModeSelection = 'dialog_exclusions_mode_selection',
    DialogAddWebsiteExclusion = 'dialog_add_website_exclusion',
    ExclusionsDomainDetailsScreen = 'exclusions_domain_details_screen',
    DialogExclusionsAddSubdomain = 'dialog_exclusions_add_subdomain',
    DialogExclusionsAddNotValidDomain = 'dialog_exclusions_add_not_valid_domain',
    DialogExclusionsRemoveAll = 'dialog_exclusions_remove_all',
}

/**
 * Event names passed to telemetry.
 */
export enum TelemetryActionName {
    // Popup actions
    OnboardingPurchaseClick = 'onboarding_purchase_click',
    OnboardingStayFreeClick = 'onboarding_stay_free_click',
    PromoOfferPurchaseClick = 'promo_offer_purchase_click',
    PromoOfferClick = 'promo_offer_click',
    ConnectClick = 'connect_click',
    DisconnectClick = 'disconnect_click',
    PurchaseClick = 'purchase_click',
    FreeGbClick = 'free_gb_click',
    SpeedReducedPurchaseClick = 'speed_reduced_purchase_click',

    // Options actions
    AddWebsiteClick = 'add_website_click',
    GeneralModeClick = 'general_mode_click',
    SelectiveModeClick = 'selective_mode_click',
    AddWebsiteFromList = 'add_website_from_list',
    AddWebsiteManually = 'add_website_manually',
}

/**
 * Action to screen mapping.
 */
export interface TelemetryActionToScreenMap {
    // Popup actions
    [TelemetryActionName.OnboardingPurchaseClick]: TelemetryScreenName.PurchaseScreen;
    [TelemetryActionName.OnboardingStayFreeClick]: TelemetryScreenName.PurchaseScreen;
    [TelemetryActionName.PromoOfferPurchaseClick]: TelemetryScreenName.PromoOfferScreen;
    [TelemetryActionName.PromoOfferClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.ConnectClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.DisconnectClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.PurchaseClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.FreeGbClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.SpeedReducedPurchaseClick]: TelemetryScreenName.SpeedReducedScreen;

    // Options actions
    [TelemetryActionName.AddWebsiteClick]: TelemetryScreenName.ExclusionsScreen;
    [TelemetryActionName.GeneralModeClick]: TelemetryScreenName.DialogExclusionsModeSelection;
    [TelemetryActionName.SelectiveModeClick]: TelemetryScreenName.DialogExclusionsModeSelection;
    [TelemetryActionName.AddWebsiteFromList]: TelemetryScreenName.DialogAddWebsiteExclusion;
    [TelemetryActionName.AddWebsiteManually]: TelemetryScreenName.DialogAddWebsiteExclusion;
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
