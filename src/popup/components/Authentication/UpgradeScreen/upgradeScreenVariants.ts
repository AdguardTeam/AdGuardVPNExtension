import { type OnboardingGoal } from '../../../stores';
import { translator } from '../../../../common/translator';
import { POTENTIAL_DEVICE_NUM, UNLIMITED_LOCATIONS_COUNT } from '../../../../common/components/constants';
import {
    TelemetryActionName,
    TelemetryScreenName,
    type TelemetryActionToScreenMap,
} from '../../../../background/telemetry/telemetryEnums';

/**
 * Single feature row rendered in the upgrade screen features list.
 */
interface UpgradeScreenFeature {
    /**
     * Stable identifier used as the React list key.
     */
    id: string;

    /**
     * Icon name from the shared Icon set.
     */
    icon: string;

    /**
     * Localized feature text.
     */
    text: string;
}

/**
 * Pair of a telemetry action and the screen it must be reported against.
 * Links the action to its allowed screen at the type level so dispatch sites
 * stay type-checked without casts.
 */
interface TelemetryActionScreenPair<A extends TelemetryActionName> {
    /**
     * Action sent on a CTA click.
     */
    actionName: A;

    /**
     * Screen reported with the action. Fixed by {@link actionName} via
     * {@link TelemetryActionToScreenMap}.
     */
    screenName: TelemetryActionToScreenMap[A];
}

/**
 * Page-view screens used by the upgrade screen variants.
 */
type UpgradeScreenPageViewScreen = TelemetryScreenName.VarBPurchaseScreen
| TelemetryScreenName.PurchaseScreen;

/**
 * Per-variant content and telemetry for the upgrade screen.
 *
 * Allows the same card layout to be reused for the default onboarding upgrade
 * screen and for every personalized onboarding goal variant — only the fields
 * below differ between variants.
 */
export interface UpgradeScreenVariant {
    /**
     * Title shown at the top of the card.
     */
    title: string;

    /**
     * Optional description paragraph shown under the title. Omitted for the
     * personalized goal variants.
     */
    description?: string;

    /**
     * Feature rows rendered in the features list.
     */
    features: UpgradeScreenFeature[];

    /**
     * Label for the primary "Get Unlimited" call to action.
     */
    ctaLabel: string;

    /**
     * Label for the secondary "skip" call to action.
     */
    skipLabel: string;

    /**
     * Screen name sent on the page view telemetry event.
     */
    pageViewScreen: UpgradeScreenPageViewScreen;

    /**
     * Telemetry sent on the primary CTA click.
     */
    ctaTelemetry: TelemetryActionScreenPair<TelemetryActionName.GetUnlimitedClick>
    | TelemetryActionScreenPair<TelemetryActionName.OnboardingPurchaseClick>;

    /**
     * Telemetry sent on the secondary CTA click.
     */
    skipTelemetry: TelemetryActionScreenPair<TelemetryActionName.MaybeLaterClick>
    | TelemetryActionScreenPair<TelemetryActionName.PrivacyMaybeLaterClick>
    | TelemetryActionScreenPair<TelemetryActionName.StreamMaybeLaterClick>
    | TelemetryActionScreenPair<TelemetryActionName.CensorMaybeLaterClick>;
}

/**
 * Shared fields for personalized onboarding paywall variants.
 */
type PersonalizedVariantFields = Pick<UpgradeScreenVariant, 'title' | 'features' | 'skipTelemetry'>;

/**
 * Fills shared CTA labels, pageview screen and purchase telemetry for a
 * personalized onboarding paywall variant.
 *
 * @param fields Goal-specific title, features and skip telemetry.
 *
 * @returns Complete upgrade screen variant for the goal.
 */
const createPersonalizedVariant = (fields: PersonalizedVariantFields): UpgradeScreenVariant => ({
    ...fields,
    ctaLabel: translator.getMessage('popup_paywall_get_unlimited'),
    skipLabel: translator.getMessage('popup_paywall_maybe_later'),
    pageViewScreen: TelemetryScreenName.PurchaseScreen,
    ctaTelemetry: {
        actionName: TelemetryActionName.OnboardingPurchaseClick,
        screenName: TelemetryScreenName.PurchaseScreen,
    },
});

/**
 * Shown after the default onboarding and for the
 * personalized onboarding when no goal was selected.
 *
 * @returns Default upgrade screen variant.
 */
export const getDefaultUpgradeVariant = (): UpgradeScreenVariant => ({
    title: translator.getMessage('popup_upgrade_b_title_line1'),
    description: translator.getMessage('popup_upgrade_b_description'),
    features: [
        {
            id: 'rocket',
            icon: 'rocket',
            text: translator.getMessage('popup_upgrade_b_feature_speed'),
        },
        {
            id: 'globe',
            icon: 'globe',
            text: translator.getMessage('popup_upgrade_b_feature_locations', {
                count: UNLIMITED_LOCATIONS_COUNT,
            }),
        },
        {
            id: 'device',
            icon: 'device',
            text: translator.getMessage('popup_upgrade_b_feature_devices', {
                count: POTENTIAL_DEVICE_NUM,
            }),
        },
        {
            id: 'web-activity',
            icon: 'web-activity',
            text: translator.getMessage('popup_upgrade_b_feature_dns'),
        },
    ],
    ctaLabel: translator.getMessage('popup_upgrade_b_btn_get_unlimited'),
    skipLabel: translator.getMessage('popup_upgrade_b_btn_maybe_later'),
    pageViewScreen: TelemetryScreenName.VarBPurchaseScreen,
    ctaTelemetry: {
        actionName: TelemetryActionName.GetUnlimitedClick,
        screenName: TelemetryScreenName.VarBPurchaseScreen,
    },
    skipTelemetry: {
        actionName: TelemetryActionName.MaybeLaterClick,
        screenName: TelemetryScreenName.VarBPurchaseScreen,
    },
});

/**
 * Goal-tailored upgrade screen variants for the personalized onboarding
 * (AG-55378). Each variant keeps its own goal-specific title, features and
 * skip telemetry but reuses shared CTA labels and purchase telemetry.
 *
 * @returns Record mapping each goal to its upgrade screen variant.
 */
export const getGoalUpgradeVariants = (): Record<OnboardingGoal, UpgradeScreenVariant> => ({
    privacy: createPersonalizedVariant({
        title: translator.getMessage('popup_paywall_privacy_title'),
        features: [
            {
                id: 'privacy-encrypted',
                icon: 'encrypted',
                text: translator.getMessage('popup_paywall_privacy_feature_1'),
            },
            {
                id: 'privacy-locations',
                icon: 'globe',
                text: translator.getPlural(
                    'popup_paywall_privacy_feature_2',
                    UNLIMITED_LOCATIONS_COUNT,
                ),
            },
            {
                id: 'privacy-devices',
                icon: 'device',
                text: translator.getPlural(
                    'popup_paywall_privacy_feature_3',
                    POTENTIAL_DEVICE_NUM,
                ),
            },
        ],
        skipTelemetry: {
            actionName: TelemetryActionName.PrivacyMaybeLaterClick,
            screenName: TelemetryScreenName.PurchaseScreen,
        },
    }),
    streaming: createPersonalizedVariant({
        title: translator.getMessage('popup_paywall_streaming_title'),
        features: [
            {
                id: 'streaming-services',
                icon: 'streaming-services',
                text: translator.getMessage('popup_paywall_streaming_feature_1'),
            },
            {
                id: 'streaming-locations',
                icon: 'globe',
                text: translator.getPlural(
                    'popup_paywall_streaming_feature_2',
                    UNLIMITED_LOCATIONS_COUNT,
                ),
            },
            {
                id: 'streaming-buffering',
                icon: 'buffering',
                text: translator.getMessage('popup_paywall_streaming_feature_3'),
            },
        ],
        skipTelemetry: {
            actionName: TelemetryActionName.StreamMaybeLaterClick,
            screenName: TelemetryScreenName.PurchaseScreen,
        },
    }),
    bypass: createPersonalizedVariant({
        title: translator.getMessage('popup_paywall_bypass_title'),
        features: [
            {
                id: 'bypass-encrypted',
                icon: 'encrypted',
                text: translator.getMessage('popup_paywall_bypass_feature_1'),
            },
            {
                id: 'bypass-devices',
                icon: 'device',
                text: translator.getPlural(
                    'popup_paywall_bypass_feature_2',
                    POTENTIAL_DEVICE_NUM,
                ),
            },
            {
                id: 'bypass-locations',
                icon: 'location',
                text: translator.getPlural(
                    'popup_paywall_bypass_feature_3',
                    UNLIMITED_LOCATIONS_COUNT,
                ),
            },
        ],
        skipTelemetry: {
            actionName: TelemetryActionName.CensorMaybeLaterClick,
            screenName: TelemetryScreenName.PurchaseScreen,
        },
    }),
});
