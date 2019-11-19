import { action } from 'mobx';

class PopupActions {
    @action
    openRecovery = async () => {
        await adguard.tabs.openRecovery();
        await adguard.tabs.closePopup();
    };

    @action
    openTab = async (url) => {
        await adguard.tabs.openTab(url);
        await adguard.tabs.closePopup();
    };

    @action
    openVpnFailurePage = async () => {
        const vpnFailurePage = await adguard.vpn.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };
}

const popupActions = new PopupActions();

export default popupActions;
