import { action } from 'mobx';

class PopupActions {
    @action
    openRecovery = async () => {
        await adguard.tabs.openRecovery();
        window.close();
    };

    @action
    openTab = async (url) => {
        await adguard.tabs.openTab(url);
        window.close();
    };

    @action
    openVpnFailurePage = async () => {
        const vpnFailurePage = await adguard.endpoints.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };
}

const popupActions = new PopupActions();

export default popupActions;
