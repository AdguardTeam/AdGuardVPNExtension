import { action, observable } from 'mobx';

class UiStore {
    @observable showEndpoints = false;

    @action
    setShowEndpoints = (value) => {
        this.showEndpoints = value;
    }
}

const uiStore = new UiStore();

export default uiStore;
