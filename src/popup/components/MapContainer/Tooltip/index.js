import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import rootStore from '../../../stores';

const Tooltip = observer(() => {
    const { tooltipStore, endpointsStore, settingsStore } = useContext(rootStore);

    if (!tooltipStore.tooltipContent) {
        return null;
    }

    const {
        cityName,
        premiumOnly,
    } = tooltipStore.tooltipContent;

    // TODO [maximtop] send user to provided link
    const unblockLocationHandler = () => {
        console.log('send users to bye something');
        tooltipStore.closeTooltip();
    };

    const createConnectionHandler = async () => {
        await endpointsStore.setSelectedEndpoint(tooltipStore.tooltipContent.id);
        await settingsStore.setGlobalProxyEnabled(true);
        tooltipStore.closeTooltip();
    };

    const renderButton = (premiumOnly) => {
        const handler = premiumOnly ? unblockLocationHandler : createConnectionHandler;
        const buttonType = premiumOnly ? 'premium' : 'regular';
        const buttonClassNames = classnames(
            'button', 'tooltip__btn', `tooltip__btn--${buttonType}`
        );
        const buttonText = premiumOnly ? 'Unblock location' : 'Create connection';
        return (
            <button
                type="button"
                className={buttonClassNames}
                onClick={handler}
            >
                {buttonText}
            </button>
        );
    };

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
                {renderButton()}
            </div>
        </div>
    );
});

export default Tooltip;
