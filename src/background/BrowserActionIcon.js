import throttle from 'lodash/throttle';
import notifier from '../lib/notifier';
import actions from './actions';
import exclusions from './exclusions';
import settings from './settings/settings';
import tabs from './tabs';

class BrowserActionIcon {
    constructor() {
        this.init();
    }

    async updateIcon(tab) {
        const { id = null, url = null } = tab;
        const proxyEnabled = settings.isProxyEnabled();
        if (!proxyEnabled) {
            await actions.setIconDisabled(id);
            return;
        }
        const isVpnEnabledForUrl = exclusions.isVpnEnabledByUrl(url);
        if (id && url && !isVpnEnabledForUrl) {
            await actions.setIconExcludedForUrl(id);
            return;
        }
        await actions.setIconEnabled(id);
    }

    init = () => {
        const throttleTimeoutMs = 100;
        const throttledUpdateIcon = throttle(async (tab) => {
            // eslint-disable-next-line no-param-reassign
            tab = tab || await tabs.getCurrent();
            await this.updateIcon(tab);
        }, throttleTimeoutMs, { leading: false });
        // eslint-disable-next-line max-len
        notifier.addSpecifiedListener(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.PROXY_TURNED_OFF, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.PROXY_TURNED_ON, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TAB_ACTIVATED, throttledUpdateIcon);
        notifier.addSpecifiedListener(notifier.types.TAB_UPDATED, throttledUpdateIcon);
    }
}

export default new BrowserActionIcon();
