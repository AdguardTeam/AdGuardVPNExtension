import { action } from 'mobx';
import tabs from '../../../background/tabs';
import messager from '../../../lib/messager';

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
        const vpnFailurePage = await messager.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };
}

const popupActions = new PopupActions();

export default popupActions;
