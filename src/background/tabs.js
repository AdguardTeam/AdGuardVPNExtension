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

    async openAuthWindow() {
        const authUrl = 'http://testauth.adguard.com/oauth/authorize?response_type=token&client_id=adguard-vpn-extension&redirect_uri=https://testauth.adguard.com/oauth.html&scope=trust';
        try {
            await browser.windows.create({
                url: authUrl,
                width: 750,
                height: 750,
                focused: true,
                type: 'popup',
            });
        } catch (e) {
            log.error(e.message);
            throw e;
        }
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
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        const builtAuthUrl = `${baseAuthUrl}?${qs.stringify(params)}`;
        await this.openTab(builtAuthUrl);
    }
}

const tabs = new Tabs();

export default tabs;
