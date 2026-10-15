import React, { type ReactElement, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { matchPath, useLocation } from 'react-router-dom';

import {
    TelemetryActionName,
    TelemetryScreenName,
    type TelemetryActionToScreenMap,
} from '../../../background/telemetry/telemetryEnums';
import { Icon, IconButton } from '../../../common/components/Icons';
import { POTENTIAL_DEVICE_NUM, UNLIMITED_LOCATIONS_COUNT } from '../../../common/components/constants';
import { translator } from '../../../common/translator';
import tenguNamasteImageUrl from '../../../assets/images/tengu-namaste.svg';
import { rootStore } from '../../stores';
import { PROFILES_PATH } from '../Profiles/profileRoutes';
import {
    ABOUT_PATH,
    ACCOUNT_PATH,
    FREE_GBS_PATH,
    GENERAL_PATH,
    SUPPORT_PATH,
} from '../routes';
import { Button } from '../ui/Button';

import styles from './unlimited-promo.module.pcss';

/**
 * Premium benefits advertised by the selling block.
 *
 * Built on every render (not a module constant) so that the translations are
 * re-read after a language change.
 *
 * @returns List of benefits with their icons and translated titles.
 */
const getFeatures = (): { id: string; icon: string; text: string }[] => [
    {
        id: 'speed',
        icon: 'streaming-services',
        text: translator.getMessage('settings_unlimited_promo_feature_speed'),
    },
    {
        id: 'locations',
        icon: 'location',
        text: translator.getPlural('settings_unlimited_promo_feature_locations', UNLIMITED_LOCATIONS_COUNT),
    },
    {
        id: 'devices',
        icon: 'device',
        text: translator.getPlural('settings_unlimited_promo_feature_devices', POTENTIAL_DEVICE_NUM),
    },
];

/**
 * Screens the selling block can be displayed on.
 */
type SellingBlockScreenName = TelemetryActionToScreenMap[TelemetryActionName.SellingBlockDisplayed];

/**
 * Routes of the options tabs, in the order they are matched by the router.
 *
 * The display telemetry event carries the tab the block appeared on, so the tab
 * screen is resolved from the path with the same routes the router renders. It
 * does not depend on the background `ContextBasedScreen` resolution, which
 * happens on the page view event and races with the display event on nested
 * screens.
 */
const TAB_ROUTES: { path: string; exact?: boolean; screen: SellingBlockScreenName }[] = [
    { path: GENERAL_PATH, exact: true, screen: TelemetryScreenName.GeneralSettingsScreen },
    { path: `${PROFILES_PATH}/:id/exclusions`, screen: TelemetryScreenName.ManageProfilesScreen },
    { path: `${PROFILES_PATH}/:id/dns`, screen: TelemetryScreenName.ManageProfilesScreen },
    { path: `${PROFILES_PATH}/:id/location`, screen: TelemetryScreenName.ManageProfilesScreen },
    { path: `${PROFILES_PATH}/:id`, exact: true, screen: TelemetryScreenName.ManageProfilesScreen },
    { path: PROFILES_PATH, exact: true, screen: TelemetryScreenName.ManageProfilesScreen },
    { path: ACCOUNT_PATH, screen: TelemetryScreenName.AccountScreen },
    { path: ABOUT_PATH, screen: TelemetryScreenName.AboutScreen },
    { path: SUPPORT_PATH, screen: TelemetryScreenName.SupportScreen },
    { path: FREE_GBS_PATH, screen: TelemetryScreenName.FreeGbScreen },
];

/**
 * Resolves the screen of the options tab the given path belongs to.
 *
 * Routes are matched like the options router does, so hand-typed URLs map to
 * the tabs the router renders; paths that match nothing fall back to the
 * General screen.
 *
 * @param pathname Path of the options screen.
 *
 * @returns Screen of the tab the path belongs to.
 */
const getTabScreen = (pathname: string): SellingBlockScreenName => {
    const tabRoute = TAB_ROUTES.find(({ path, exact }) => matchPath(pathname, { path, exact }));

    return tabRoute?.screen ?? TelemetryScreenName.GeneralSettingsScreen;
};

/**
 * Selling block shown for free users at the bottom of the options screens.
 *
 * Rendered by the options page layout on every screen, not by the screens
 * themselves, because the block spans the whole content area, which is wider
 * than the settings column.
 * Dismissing the block hides the premium promo in every options tab.
 */
export const UnlimitedPromo = observer((): ReactElement | null => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const { isPremiumToken, premiumFeatures } = settingsStore;

    const { pathname } = useLocation();

    const isVisible = !isPremiumToken && premiumFeatures;

    const tabScreen = getTabScreen(pathname);

    /**
     * The display event is sent once per tab: when the block appears and when
     * the options tab changes. Nested screens of a tab (DNS settings, bug
     * reporter, profile sub-routes, Free GBs sub-pages) do not resend it.
     */
    useEffect(() => {
        if (!isVisible) {
            return;
        }

        telemetryStore.sendCustomEvent(
            TelemetryActionName.SellingBlockDisplayed,
            tabScreen,
        );
    }, [isVisible, tabScreen]);

    if (!isVisible) {
        return null;
    }

    const handleUpgrade = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.GetSubscriptionClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        await settingsStore.openPremiumPromoPageFromSettings();
    };

    const handleClose = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CloseSellingBlockClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        await settingsStore.hidePremiumFeatures();
    };

    return (
        <div className={styles.promo}>
            <img
                src={tenguNamasteImageUrl}
                className={styles.image}
                alt=""
            />
            <div className={styles.content}>
                <div className={styles.title}>
                    {translator.getMessage('settings_unlimited_promo_title')}
                </div>
                <ul className={styles.features}>
                    {getFeatures().map(({ id, icon, text }) => (
                        <li key={id} className={styles.feature}>
                            <Icon
                                name={icon}
                                color="product"
                            />
                            <span>{text}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Button
                className={styles.button}
                onClick={handleUpgrade}
            >
                {translator.getMessage('settings_unlimited_promo_upgrade_button')}
            </Button>
            <IconButton
                name="cross"
                className={styles.close}
                onClick={handleClose}
            />
        </div>
    );
});
