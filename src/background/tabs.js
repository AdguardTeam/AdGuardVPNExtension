import browser from 'webextension-polyfill';
import qs from 'qs';
import log from '../lib/logger';

class Tabs {
    async getCurrent() {
        const { id: windowId } = await browser.windows.getLastFocused({});
        const tabs = await browser.tabs.query({ active: true, windowId });
        return tabs[0];
    }

    async getCurrentTabUrl() {
        const tab = await this.getCurrent();
        return tab.url;
    }

    async getPopup() {
        return browser.browserAction.getPopup();
    }

    async openRecovery() {
        const recoveryUrl = 'http://example.org#recovery';
        await browser.tabs.create({ url: recoveryUrl });
    }

    async openTab(url) {
        await browser.tabs.create({ url, active: true });
    }

    /**
     * Closes one or more tabs.
     * @param {(number|number[])} tabsIds
     * @returns {Promise<void>}
     */
    async closeTab(tabsIds) {
        await browser.tabs.remove(tabsIds);
    }

    async closePopup() {
        const popup = await this.getPopup();
        popup.close();
    }

    async openSocialAuth(socialProvider) {
        const baseAuthUrl = 'https://testauth.adguard.com/oauth/authorize';
        const redirectUri = 'https://testauth.adguard.com/oauth.html';

        const params = {
            response_type: 'token',
            client_id: 'adguard-vpn-extension',
            redirect_uri: redirectUri,
            scope: 'trust',
        };

        switch (socialProvider) {
            case 'google': {
                params.social_provider = 'google';
                break;
            }
            case 'twitter': {
                params.social_provider = 'twitter';
                break;
            }
            case 'vk': {
                params.social_provider = 'vk';
                break;
            }
            case 'yandex': {
                params.social_provider = 'yandex';
                break;
            }
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        const builtAuthUrl = `${baseAuthUrl}?${qs.stringify(params)}`;
        await this.openTab(builtAuthUrl);
    }
}

const tabs = new Tabs();

export default tabs;
