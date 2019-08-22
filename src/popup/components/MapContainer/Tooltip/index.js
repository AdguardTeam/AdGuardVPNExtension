import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const Tooltip = observer(() => {
    const { tooltipStore } = useContext(rootStore);

    if (tooltipStore.tooltipContent) {
        const {
            cityName,
            premiumOnly,
        } = tooltipStore.tooltipContent;

        return (
            <div className="tooltip">
                <button
                    type="button"
                    className="button tooltip__close"
                    onClick={() => { tooltipStore.closeTooltip(); }}
                />
                <div className="tooltip__content">
                    <span className="tooltip__title">
                        { cityName }
                    </span>
                    { premiumOnly && (
                        <span className="tooltip__premium">
                            &nbsp;(premium)
                        </span>
                    ) }
                </div>
                <div className="tooltip__btns">
                    <button type="button" className={`button tooltip__btn ${premiumOnly ? 'tooltip__btn--premium' : 'tooltip__btn--regular'}`}>
                        {
                            premiumOnly ? 'Unblock location' : 'Create connection'
                        }
                    </button>
                </div>
            </div>
        );
    }
    return null;
});

export default Tooltip;
