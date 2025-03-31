import type browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';

import { notifier } from '../common/notifier';
import { isHttp } from '../common/utils/string';
import { log } from '../common/logger';

import { actions } from './actions';
import { exclusions } from './exclusions';
import { type PreparedTab, tabs } from './tabs';
import { auth } from './auth/auth';
import { locationsService } from './endpoints/locationsService';
import { connectivityService } from './connectivity/connectivityService';

class BrowserActionIcon {
    isVpnEnabledForUrl = (id?: number, url?: string) => {
        if (id && url && isHttp(url)) {
            return exclusions.isVpnEnabledByUrl(url);
        }
        if (url && !isHttp(url)) {
            // disable icon in tabs with no url only for selective mode
            return !exclusions.isInverted();
        }

        return true;
    };

    async updateIcon(tab: PreparedTab) {
        const { id, url } = tab;

        if (!id) {
            log.error('Unable to get tab id to update icon');
            return;
        }

        const isUserAuthenticated = await auth.isAuthenticated(false);
        if (!isUserAuthenticated) {
            await actions.setIconDisabled(id);
            await actions.clearBadgeText(id);
            return;
        }

        if (!connectivityService.isVPNConnected()) {
            await actions.setIconDisabled(id);
            await actions.clearBadgeText(id);
            return;
        }

        if (!this.isVpnEnabledForUrl(id, url)) {
            await actions.setIconDisabled(id);
            await actions.clearBadgeText(id);
            return;
        }

        await actions.setIconEnabled(id);
        // Set badge text
        const selectedLocation = await locationsService.getSelectedLocation();
        const countryCode = selectedLocation?.countryCode;
        if (countryCode) {
            await actions.setBadgeText(countryCode, id);
        } else {
            await actions.clearBadgeText(id);
        }
    }

    init = () => {
        const throttleTimeoutMs = 100;
        const throttledUpdateIcon = throttle(async (tab?: browser.Tabs.Tab) => {
            if (tab) {
                await this.updateIcon(tab);
            } else {
                // get all active tabs, because tabs api sometimes doesn't return right active tab
                const activeTabs = await tabs.getActive();
                activeTabs.forEach((tab) => {
                    this.updateIcon(tab);
                });
            }
        }, throttleTimeoutMs, { leading: false });

        notifier.addSpecifiedListener(notifier.types.TAB_ACTIVATED, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TAB_UPDATED, throttledUpdateIcon);
        notifier.addSpecifiedListener(
            notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE,
            throttledUpdateIcon,
        );
        notifier.addSpecifiedListener(
            notifier.types.UPDATE_BROWSER_ACTION_ICON,
            throttledUpdateIcon,
        );
        notifier.addSpecifiedListener(
            notifier.types.CONNECTIVITY_STATE_CHANGED,
            () => throttledUpdateIcon(),
        );

        // Run after init in order to update browser action icon state
        throttledUpdateIcon();
    };
}

export const browserActionIcon = new BrowserActionIcon();
