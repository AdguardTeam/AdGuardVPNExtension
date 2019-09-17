import { action } from 'mobx';
import bgProvider from '../../../lib/background-provider';

class PopupActions {
    @action openRecovery = async () => {
        await bgProvider.tabs.openRecovery();
        await bgProvider.tabs.closePopup();
    };
}

const popupActions = new PopupActions();

export default popupActions;
