import { action, observable } from 'mobx';

export class UiStore {
    @observable isOpenEndpointsSearch = false;

    @observable isOpenOptionsModal = false;

    @observable isOpenRecovery = false;

    @observable isConnecting = false;

    @observable isRateModalVisible = true;

    @observable isConfirmRateModalVisible = false;

    @observable rating = 0;

    @action enableConnecting = () => {
        this.isConnecting = true;
    };

    @action disableConnecting = () => {
        this.isConnecting = false;
    };

    @action openEndpointsSearch = () => {
        this.isOpenEndpointsSearch = true;
    };

    @action closeEndpointsSearch = () => {
        this.isOpenEndpointsSearch = false;
    };

    @action openOptionsModal = () => {
        this.isOpenOptionsModal = true;
    };

    @action closeOptionsModal = () => {
        this.isOpenOptionsModal = false;
    };

    @action setRating = (value) => {
        this.rating = value;
    };

    @action openRateModal = () => {
        this.isRateModalVisible = true;
    };

    @action closeRateModal = () => {
        this.isRateModalVisible = false;
    };

    @action openConfirmRateModal = () => {
        this.isConfirmRateModalVisible = true;
    };

    @action closeConfirmRateModal = () => {
        this.isConfirmRateModalVisible = false;
    };
}
