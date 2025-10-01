import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { Ping } from '../../Ping';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Icon } from '../../../../common/components/Icons';
import { getFlagIconStyle } from '../../Locations';

import './endpoint.pcss';

export const CurrentEndpoint = observer(() => {
    const {
        vpnStore,
        settingsStore,
        uiStore,
    } = useContext(rootStore);

    const {
        countryNameToDisplay,
        cityNameToDisplay,
        countryCodeToDisplay,
        selectedLocationPing,
    } = vpnStore;

    const { isConnected } = settingsStore;

    const clickHandler = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        uiStore.openLocationsScreen();
    };

    const titleClass = classnames('endpoint__location-name', 'endpoint__title', { 'endpoint__title--selected': isConnected });

    const flagClass = classnames('endpoint__flag', { 'endpoint__flag--active': isConnected });

    const renderPing = (): ReactElement => {
        if (selectedLocationPing) {
            return (
                <Ping
                    ping={selectedLocationPing}
                    selected={settingsStore.isConnected}
                />
            );
        }

        return <div className="ping">—</div>;
    };

    return (
        <div className="endpoint__current">
            <button
                type="button"
                className="endpoint"
                onClick={clickHandler}
            >
                <div className="endpoint__info">
                    <div className={flagClass} style={getFlagIconStyle(countryCodeToDisplay)} />
                    <div className="endpoint__location-container">
                        <div className={titleClass}>
                            {countryNameToDisplay}
                        </div>
                        <div className="endpoint__location-name endpoint__desc">
                            {cityNameToDisplay}
                        </div>
                    </div>
                </div>
                <div className="endpoint__ping-container">
                    <div>
                        {renderPing()}
                        {settingsStore.hasLimitExceededError && (
                            <div className="endpoint__limited-speed">
                                {reactTranslator.getMessage('popup_traffic_limited_speed')}
                            </div>
                        )}
                    </div>
                    <Icon
                        name="arrow-down"
                        color="gray"
                        rotation="clockwise"
                        className="arrow-icon"
                    />
                </div>
            </button>
        </div>
    );
});
