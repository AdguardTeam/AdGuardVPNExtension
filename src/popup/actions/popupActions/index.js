import { action } from 'mobx';
import bgProvider from '../../../lib/background-provider';

class PopupActions {
    @action openRecovery = async () => {
        await bgProvider.tabs.openRecovery();
        await bgProvider.tabs.closePopup();
    };

    @action openSocialAuth = async (social) => {
        await bgProvider.tabs.openSocialAuth(social);
        await bgProvider.tabs.closePopup();
    };

    @action authenticate = async (credentials) => {
        await bgProvider.auth.authenticate(credentials);
    };
}

const popupActions = new PopupActions();

export default popupActions;
