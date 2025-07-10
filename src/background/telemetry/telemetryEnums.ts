/**
 * IMPORTANT:
 * Do not import inside this file other dependencies,
 * because imports of this file are also used in the popup
 * and redundant code from background may get into popup code
 */

/**
 * Screen names passed to telemetry.
 */
export enum TelemetryScreenName {
    // Popup screens
    AuthScreen = 'auth_screen',
    AuthLoginScreen1 = 'auth_login_screen1',
    AuthLoginScreen2 = 'auth_login_screen2',
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
    DialogCantConnect = 'dialog_cant_connect',
    StatsScreen = 'stats_screen',
    DisabledStatsScreen = 'disabled_stats_screen',
    LocationStatsScreen = 'location_stats_screen',
    DisabledLocationStatsScreen = 'disabled_location_stats_screen',
    AllLocationsStatsScreen = 'all_locations_stats_screen',
    DisabledAllLocationsStatsScreen = 'disabled_all_locations_stats_screen',
    SettingsStatsScreen = 'settings_stats_screen',
    WhySafeScreen = 'why_safe_screen',
    DisableStatsScreen = 'disable_stats_screen',
    ClearStatsScreen = 'clear_stats_screen',

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

    /**
     * This is special screen name. Used as flag to send telemetry
     * action events based on what screen is currently active.
     */
    ContextBasedScreen = 'context_based_screen',
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
    OpenAndroidPromoClick = 'open_android_promo_click',
    CloseAndroidPromoClick = 'close_android_promo_click',
    DeclineAndroidPromoClick = 'decline_android_promo_click',
    GotItAndroidPromoClick = 'got_it_android_promo_click',
    DontShowAndroidPromoClick = 'dont_show_android_promo_click',
    MenuGetAndroidClick = 'menu_get_android_click',
    ClosePromoOfferClick = 'close_promo_offer_click',
    DisableAnotherExtensionClick = 'disable_another_extension_click',
    MenuClick = 'menu_click',
    CloseSpeedReducesClick = 'close_speed_reduces_click',
    SettingsClick = 'settings_click',
    OtherProductsClick = 'other_products_click',
    WhyDesktopClick = 'why_desktop_click',
    RateUsClick = 'rate_us_click',
    RenewLocationsClick = 'renew_locations_click',
    SearchLocationsClick = 'search_locations_click',
    GetDesktopClick = 'get_desktop_click',
    DeclineDesktopClick = 'decline_desktop_click',
    NextOnboardingClick = 'next_onboarding_click',
    SkipOnboardingClick = 'skip_onboarding_click',
    DeclineNewsletter = 'decline_newsletter',
    AcceptNewsletter = 'accept_newsletter',
    NudgeAdguardClick = 'nudge_adguard_click',
    CloseCantConnectClick = 'close_cant_connect_click',
    AllLocationsClick = 'all_locations_click',
    SavedLocationsClick = 'saved_locations_click',
    FreeMenuStatsClick = 'free_menu_stats_click',
    MenuStatsClick = 'menu_stats_click',
    PeriodStatsClick = 'period_stats_click',
    WhySafeClick = 'why_safe_click',
    OpenDisableStatsClick = 'open_disable_stats_click',
    MenuEnableStatsClick = 'menu_enable_stats_click',
    OpenClearStatsClick = 'open_clear_stats_click',
    StatsPrivacyClick = 'stats_privacy_click',
    StatsAllLocationsClick = 'stats_all_locations_click',
    DisableStatsClick = 'disable_stats_click',
    EnableStatsClick = 'enable_stats_click',
    ClearStatsClick = 'clear_stats_click',
    DayStatsClick = 'day_stats_click',
    WeekStatsClick = 'week_stats_click',
    MonthStatsClick = 'month_stats_click',
    AllTimeStatsClick = 'all_time_stats_click',

    // Options actions
    GeneralSettingsClick = 'general_settings_click',
    ExclusionsSettingsClick = 'exclusions_settings_click',
    AccountSettingsClick = 'account_settings_click',
    SupportSettingsClick = 'support_settings_click',
    AboutSettingsClick = 'about_settings_click',
    FreeGbsSettingsClick = 'free_gbs_settings_click',
    SettingsRateUsClick = 'settings_rate_us_click',
    SettingsHideRateUsClick = 'settings_hide_rate_us_click',
    AddCustomDnsClick = 'add_custom_dns_click',
    AdguardDnsClick = 'adguard_dns_click',
    AdguardNonfilteringDnsClick = 'adguard_nonfiltering_dns_click',
    AdguardFamilyDnsClick = 'adguard_family_dns_click',
    GoogleDnsClick = 'google_dns_click',
    CloudflareDnsClick = 'cloudflare_dns_click',
    CiscoDnsClick = 'cisco_dns_click',
    QuadDnsClick = 'quad_dns_click',
    SaveCustomDnsClick = 'save_custom_dns_click',
    InviteFriendClick = 'invite_friend_click',
    ConfirmEmailClick = 'confirm_email_click',
    AddGbDeviceClick = 'add_gb_device_click',
    CopyLinkClick = 'copy_link_click',
    ResendEmailClick = 'resend_email_click',
    GoToProductsClick = 'go_to_products_click',
    GetSubscriptionClick = 'get_subscription_click',
    OpenAccountSettingsClick = 'open_account_settings_click',
    FaqClick = 'faq_click',
    ReportBugClick = 'report_bug_click',
    LeaveFeedbackClick = 'leave_feedback_click',
    SendReportClick = 'send_report_click',
    SendInfoClick = 'send_info_click',
    OfficialWebClick = 'official_web_click',
    ModeClick = 'mode_click',
    SearchWebsite = 'search_website',
    AddWebsiteClick = 'add_website_click',
    GeneralModeClick = 'general_mode_click',
    SelectiveModeClick = 'selective_mode_click',
    SearchFromList = 'search_from_list',
    AddWebsiteFromList = 'add_website_from_list',
    SaveWebsiteClick = 'save_website_click',
    AddWebsiteManually = 'add_website_manually',
    ExitInvalidDomainClick = 'exit_invalid_domain_click',
    AddInvalidDomainClick = 'add_invalid_domain_click',
}

/**
 * Header can be shown on different screens.
 */
export type HeaderScreenNames = TelemetryScreenName.HomeScreen | TelemetryScreenName.DisableAnotherVpnExtensionScreen;

/**
 * Sidebar link item click actions.
 */
export type SidebarLinkItemClickActionNames = TelemetryActionName.GeneralSettingsClick
| TelemetryActionName.ExclusionsSettingsClick
| TelemetryActionName.AccountSettingsClick
| TelemetryActionName.SupportSettingsClick
| TelemetryActionName.AboutSettingsClick
| TelemetryActionName.FreeGbsSettingsClick;

/**
 * DNS server click actions.
 */
export type DnsServerClickActionNames = TelemetryActionName.AdguardDnsClick
| TelemetryActionName.AdguardNonfilteringDnsClick
| TelemetryActionName.AdguardFamilyDnsClick
| TelemetryActionName.GoogleDnsClick
| TelemetryActionName.CloudflareDnsClick
| TelemetryActionName.CiscoDnsClick
| TelemetryActionName.QuadDnsClick;

/**
 * Free GB item click actions.
 */
export type FreeGbItemClickActionNames = TelemetryActionName.InviteFriendClick
| TelemetryActionName.ConfirmEmailClick
| TelemetryActionName.AddGbDeviceClick;

/**
 * Support item click actions.
 */
export type SupportItemClickActionNames = TelemetryActionName.FaqClick
| TelemetryActionName.ReportBugClick
| TelemetryActionName.LeaveFeedbackClick;

/**
 * Locations tab click action names.
 */
export type LocationsTabClickActionNames = TelemetryActionName.AllLocationsClick
| TelemetryActionName.SavedLocationsClick;

/**
 * Stats range click action names.
 */
export type StatsRangeClickActionNames = TelemetryActionName.DayStatsClick
| TelemetryActionName.WeekStatsClick
| TelemetryActionName.MonthStatsClick
| TelemetryActionName.AllTimeStatsClick;

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
    [TelemetryActionName.FreeGbClick]: HeaderScreenNames;
    [TelemetryActionName.OpenAndroidPromoClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.CloseAndroidPromoClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.DeclineAndroidPromoClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.GotItAndroidPromoClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.DontShowAndroidPromoClick]: TelemetryScreenName.HomeScreen;
    [TelemetryActionName.MenuGetAndroidClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.SpeedReducedPurchaseClick]: TelemetryScreenName.SpeedReducedScreen;
    [TelemetryActionName.ClosePromoOfferClick]: TelemetryScreenName.PromoOfferScreen;
    [TelemetryActionName.DisableAnotherExtensionClick]: TelemetryScreenName.DisableAnotherVpnExtensionScreen;
    [TelemetryActionName.MenuClick]: HeaderScreenNames;
    [TelemetryActionName.CloseSpeedReducesClick]: TelemetryScreenName.SpeedReducedScreen;
    [TelemetryActionName.SettingsClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.OtherProductsClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.WhyDesktopClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.RateUsClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.RenewLocationsClick]: TelemetryScreenName.LocationsScreen;
    [TelemetryActionName.SearchLocationsClick]: TelemetryScreenName.LocationsScreen;
    [TelemetryActionName.GetDesktopClick]: TelemetryScreenName.DialogDesktopVersionPromo;
    [TelemetryActionName.DeclineDesktopClick]: TelemetryScreenName.DialogDesktopVersionPromo;
    [TelemetryActionName.NextOnboardingClick]: TelemetryScreenName.OnboardingScreen;
    [TelemetryActionName.SkipOnboardingClick]: TelemetryScreenName.OnboardingScreen;
    [TelemetryActionName.DeclineNewsletter]: TelemetryScreenName.NewsletterScreen;
    [TelemetryActionName.AcceptNewsletter]: TelemetryScreenName.NewsletterScreen;
    [TelemetryActionName.NudgeAdguardClick]: TelemetryScreenName.DialogCantConnect;
    [TelemetryActionName.CloseCantConnectClick]: TelemetryScreenName.DialogCantConnect;
    [TelemetryActionName.AllLocationsClick]: TelemetryScreenName.LocationsScreen;
    [TelemetryActionName.SavedLocationsClick]: TelemetryScreenName.LocationsScreen;
    [TelemetryActionName.FreeMenuStatsClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.MenuStatsClick]: TelemetryScreenName.MenuScreen;
    [TelemetryActionName.PeriodStatsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.WhySafeClick]: TelemetryScreenName.SettingsStatsScreen;
    [TelemetryActionName.OpenDisableStatsClick]: TelemetryScreenName.SettingsStatsScreen;
    [TelemetryActionName.MenuEnableStatsClick]: TelemetryScreenName.SettingsStatsScreen;
    [TelemetryActionName.OpenClearStatsClick]: TelemetryScreenName.SettingsStatsScreen;
    [TelemetryActionName.StatsPrivacyClick]: TelemetryScreenName.WhySafeScreen;
    [TelemetryActionName.StatsAllLocationsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.DisableStatsClick]: TelemetryScreenName.DisableStatsScreen;
    [TelemetryActionName.EnableStatsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.ClearStatsClick]: TelemetryScreenName.ClearStatsScreen;
    [TelemetryActionName.DayStatsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.WeekStatsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.MonthStatsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.AllTimeStatsClick]: TelemetryScreenName.ContextBasedScreen;

    // Options actions
    [TelemetryActionName.GeneralSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.ExclusionsSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.AccountSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.SupportSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.AboutSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.FreeGbsSettingsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.SettingsRateUsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.SettingsHideRateUsClick]: TelemetryScreenName.ContextBasedScreen;
    [TelemetryActionName.AddCustomDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.AdguardDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.AdguardNonfilteringDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.AdguardFamilyDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.GoogleDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.CloudflareDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.CiscoDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.QuadDnsClick]: TelemetryScreenName.SettingsDnsServersScreen;
    [TelemetryActionName.SaveCustomDnsClick]: TelemetryScreenName.DialogAddCustomDns,
    [TelemetryActionName.InviteFriendClick]: TelemetryScreenName.FreeGbScreen;
    [TelemetryActionName.ConfirmEmailClick]: TelemetryScreenName.FreeGbScreen;
    [TelemetryActionName.AddGbDeviceClick]: TelemetryScreenName.FreeGbScreen;
    [TelemetryActionName.CopyLinkClick]: TelemetryScreenName.FreeGbInviteFriendScreen;
    [TelemetryActionName.ResendEmailClick]: TelemetryScreenName.FreeGbConfirmEmailScreen;
    [TelemetryActionName.GoToProductsClick]: TelemetryScreenName.FreeGbAddAnotherPlatformScreen;
    [TelemetryActionName.GetSubscriptionClick]: TelemetryScreenName.AccountScreen;
    [TelemetryActionName.OpenAccountSettingsClick]: TelemetryScreenName.AccountScreen;
    [TelemetryActionName.FaqClick]: TelemetryScreenName.SupportScreen;
    [TelemetryActionName.ReportBugClick]: TelemetryScreenName.SupportScreen;
    [TelemetryActionName.LeaveFeedbackClick]: TelemetryScreenName.SupportScreen;
    [TelemetryActionName.SendReportClick]: TelemetryScreenName.SupportReportBugScreen;
    [TelemetryActionName.SendInfoClick]: TelemetryScreenName.SupportReportBugScreen;
    [TelemetryActionName.OfficialWebClick]: TelemetryScreenName.AboutScreen;
    [TelemetryActionName.ModeClick]: TelemetryScreenName.ExclusionsScreen;
    [TelemetryActionName.SearchWebsite]: TelemetryScreenName.ExclusionsScreen;
    [TelemetryActionName.AddWebsiteClick]: TelemetryScreenName.ExclusionsScreen;
    [TelemetryActionName.GeneralModeClick]: TelemetryScreenName.DialogExclusionsModeSelection;
    [TelemetryActionName.SelectiveModeClick]: TelemetryScreenName.DialogExclusionsModeSelection;
    [TelemetryActionName.SearchFromList]: TelemetryScreenName.DialogAddWebsiteExclusion;
    [TelemetryActionName.AddWebsiteFromList]: TelemetryScreenName.DialogAddWebsiteExclusion;
    [TelemetryActionName.SaveWebsiteClick]: TelemetryScreenName.DialogAddWebsiteExclusion;
    [TelemetryActionName.AddWebsiteManually]: TelemetryScreenName.DialogAddWebsiteExclusion;
    [TelemetryActionName.ExitInvalidDomainClick]: TelemetryScreenName.DialogExclusionsAddNotValidDomain;
    [TelemetryActionName.AddInvalidDomainClick]: TelemetryScreenName.DialogExclusionsAddNotValidDomain;
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
