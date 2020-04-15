import { action } from 'mobx';
import tabs from '../../../background/tabs';

class PopupActions {
    @action
    openRecovery = async () => {
        await tabs.openRecovery();
        window.close();
    };

    @action
    openTab = async (url) => {
        await tabs.openTab(url);
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
