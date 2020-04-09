import throttle from 'lodash/throttle';
import notifier from '../lib/notifier';
import actions from './actions';
import exclusions from './exclusions';
import settings from './settings/settings';
import tabs from './tabs';
import { isHttp } from '../lib/string-utils';
import endpoints from './endpoints';

class BrowserActionIcon {
    constructor() {
        this.init();
    }

    shouldUpdateIcon = (id, url) => {
        return id
            && url
            && isHttp(url)
            && !exclusions.isVpnEnabledByUrl(url);
    };

    async updateIcon(tab) {
        const { id = null, url = null } = tab;
        const proxyEnabled = settings.isProxyEnabled();
        const overTrafficLimits = endpoints.getVpnInfo(true)?.overTrafficLimits;
        if (overTrafficLimits) {
            await actions.setIconTrafficOff(id);
            return;
        }

        if (!proxyEnabled) {
            await actions.setIconDisabled(id);
            return;
        }

        if (this.shouldUpdateIcon(id, url)) {
            await actions.setIconExcludedForUrl(id);
            return;
        }

        await actions.setIconEnabled(id);
    }

    init = () => {
        const throttleTimeoutMs = 100;
        const throttledUpdateIcon = throttle(async (tab) => {
            if (tab) {
                this.updateIcon(tab);
            } else {
                // get all active tabs, because tabs api sometimes doesn't return right active tab
                const activeTabs = await tabs.getActive();
                activeTabs.forEach((tab) => {
                    this.updateIcon(tab);
                });
            }
        }, throttleTimeoutMs, { leading: false });
        // eslint-disable-next-line max-len
        notifier.addSpecifiedListener(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.PROXY_TURNED_OFF, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.PROXY_TURNED_ON, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TAB_ACTIVATED, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TAB_UPDATED, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TRAFFIC_OVER_LIMIT, throttledUpdateIcon);
    };
}

export default new BrowserActionIcon();
