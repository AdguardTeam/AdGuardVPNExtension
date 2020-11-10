import { action, observable } from 'mobx';

class UiStore {
    @observable isOpenEndpointsSearch = false;

    @observable isOpenOptionsModal = false;

    @observable isOpenRecovery = false;

    @observable isConnecting = false;

    @action
    enableConnecting = () => {
        this.isConnecting = true;
    };

    @action
    disableConnecting = () => {
        this.isConnecting = false;
    };

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
    };
}

export default UiStore;
