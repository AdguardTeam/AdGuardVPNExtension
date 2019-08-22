import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';
import './tooltip.pcss';

const Tooltip = observer(() => {
    const { tooltipStore } = useContext(rootStore);
    if (tooltipStore.isTooltipOpen) {
        return (
            <div className="tooltip">
            tooltip
            </div>
        );
    }
    return null;
});

export default Tooltip;
