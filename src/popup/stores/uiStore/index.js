import { action, observable } from 'mobx';

class UiStore {
    @observable isOpenEndpointsSearch = false;

    @observable isOpenOptionsModal = false;

    @action
    openEndpointsSearch = () => {
        this.isOpenEndpointsSearch = true;
    };

    @action
    closeEndpointsSearch = () => {
        this.isOpenEndpointsSearch = false;
    };

    @action
    openOptionsModal = () => {
        this.isOpenOptionsModal = true;
    };

    @action
    closeOptionsModal = () => {
        this.isOpenOptionsModal = false;
    }
}

const uiStore = new UiStore();

export default uiStore;
