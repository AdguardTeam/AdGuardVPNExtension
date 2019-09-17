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
        id: tooltipEndpointId,
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

    const disconnectHandler = async () => {
        await settingsStore.setGlobalProxyEnabled(false);
        tooltipStore.closeTooltip();
    };

    const isTooltipEndpointEnabled = settingsStore.extensionEnabled
        && tooltipEndpointId === endpointsStore.selectedEndpoint.id;

    const PREMIUM_STATE = 'premium';
    const ENABLED_STATE = 'enabled';
    const DISABLED_STATE = 'disabled';

    let currentState;

    if (premiumOnly) {
        currentState = PREMIUM_STATE;
    } else if (isTooltipEndpointEnabled) {
        currentState = ENABLED_STATE;
    } else {
        currentState = DISABLED_STATE;
    }

    const statesMap = {
        [PREMIUM_STATE]: {
            handler: unblockLocationHandler,
            buttonType: 'premium',
            buttonText: 'Unblock location',
        },
        [ENABLED_STATE]: {
            handler: disconnectHandler,
            buttonType: 'regular',
            buttonText: 'Disconnect location',
        },
        [DISABLED_STATE]: {
            handler: createConnectionHandler,
            buttonType: 'regular',
            buttonText: 'Create connection',
        },
    };

    const renderButton = () => {
        const currentStateData = statesMap[currentState];
        const { handler, buttonType, buttonText } = currentStateData;
        const buttonClassNames = classnames(
            'button', 'tooltip__btn', `tooltip__btn--${buttonType}`
        );
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
