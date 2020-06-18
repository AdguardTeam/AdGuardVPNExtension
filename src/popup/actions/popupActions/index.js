import { action } from 'mobx';
import tabs from '../../../background/tabs';
import messenger from '../../../lib/messenger';

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
        const vpnFailurePage = await messenger.getVpnFailurePage();
        await this.openTab(vpnFailurePage);
    };
}

const popupActions = new PopupActions();

export default popupActions;
