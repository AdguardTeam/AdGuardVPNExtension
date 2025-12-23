import { tabs } from '../../tabs';
import { messenger } from '../../messenger';
import { Prefs } from '../../prefs';

class NavActions {
    /**
     * Opens a new window with the specified URL.
     * For firefox android uses tabs api instead of window since window.open() doesn't work from extension.
     *
     * @param url Url of opened window/tab.
     */
    openWindow = async (url: string): Promise<void> => {
        if (await Prefs.isFirefoxAndroid()) {
            await this.openTab(url, false);
            return;
        }
        window.open(url, '_blank');
    };

    /**
     * Opens a new tab with the specified URL.
     * Closes the current tab if closeCurrent is true.
     *
     * @param url Url of opened tab.
     * @param closeCurrent Whether to close the current tab.
     */
    openTab = async (url: string, closeCurrent = true): Promise<void> => {
        await tabs.openTab(url);
        if (closeCurrent) {
            window.close();
        }
    };

    /**
     * Opens the VPN failure page.
     */
    openVpnFailurePage = async (): Promise<void> => {
        const vpnFailurePage = await messenger.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };

    /**
     * Opens the free GBS page.
     */
    openFreeGbsPage = async (): Promise<void> => {
        await messenger.openFreeGbsPage();
        window.close();
    };
}

export const navActions = new NavActions();
