import { action, observable, computed } from 'mobx';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;
const DEFAULT_COORDINATES = [DEFAULT_X, DEFAULT_Y];

class TooltipStore {
    @observable tooltipContent;

    @observable isTooltipOpen = false;

    @observable mapCoordinates = DEFAULT_COORDINATES;

    @action
    setMapCoordinates = (coordinates) => {
        this.mapCoordinates = coordinates;
    };

    @action
    setMapCoordinatesDefault = () => {
        this.mapCoordinates = DEFAULT_COORDINATES;
    };

    @computed
    get hasDefaultMapCoordinates() {
        const [x, y] = this.mapCoordinates;
        return x === DEFAULT_X && y === DEFAULT_Y;
    }

    @action
    openTooltip = (data) => {
        this.isTooltipOpen = true;
        this.tooltipContent = data;
        this.mapCoordinates = data.coordinates;
    };

    @action
    closeTooltip = () => {
        this.isTooltipOpen = false;
        this.tooltipContent = null;
    };
}

export default TooltipStore;
