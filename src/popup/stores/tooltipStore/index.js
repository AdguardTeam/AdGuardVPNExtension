import { action, observable } from 'mobx';

class TooltipStore {
    @observable tooltipContent = false;

    @action
    openTooltip = (e) => {
        this.tooltipContent = e;
    };

    @action
    closeTooltip = () => {
        this.tooltipContent = false;
    };
}

export default TooltipStore;
