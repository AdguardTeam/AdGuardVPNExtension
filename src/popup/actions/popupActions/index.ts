import { tabs } from '../../../background/tabs';
import { messenger } from '../../../common/messenger';

class PopupActions {
    openRecovery = async (): Promise<void> => {
        await tabs.openRecovery();
        window.close();
    };

    openTab = async (url: string): Promise<void> => {
        await tabs.openTab(url);
        window.close();
    };

    openVpnFailurePage = async (): Promise<void> => {
        const vpnFailurePage = await messenger.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };

    openFreeGbsPage = async (): Promise<void> => {
        await messenger.openFreeGbsPage();
        window.close();
    };
}

export const popupActions = new PopupActions();
