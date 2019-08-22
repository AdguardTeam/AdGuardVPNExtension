import { action, observable } from 'mobx';

class TooltipStore {
    @observable isTooltipOpen = false;

    @action
    openTooltip = () => {
        this.isTooltipOpen = true;
    };

    @action
    closeTooltip = () => {
        this.isTooltipOpen = false;
    };
}

export default TooltipStore;
