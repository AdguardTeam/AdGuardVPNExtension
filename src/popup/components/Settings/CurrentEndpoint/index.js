import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import './endpoint.pcss';
import { Ping } from '../../Ping';

const CurrentEndpoint = observer(() => {
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

    const clickHandler = (e) => {
        e.preventDefault();
        uiStore.openEndpointsSearch();
    };

    const iconClass = classnames('flag', { 'flag--active': isConnected });

    const getFlagIconStyle = (countryCode) => {
        if (!countryCode) {
            return {};
        }
        const iconName = countryCode.toLowerCase();
        return { backgroundImage: `url("../../assets/images/flags/${iconName}.svg")` };
    };

    const renderPing = () => {
        if (selectedLocationPing) {
            return <Ping ping={selectedLocationPing} />;
        }

        return <div className="ping">-</div>;
    };

    return (
        <div
            className="endpoint"
            onClick={clickHandler}
        >
            <div className="endpoint__country">
                <div className={iconClass}>
                    <span className="flag__icon" style={getFlagIconStyle(countryCodeToDisplay)} />
                </div>
            </div>
            <div className="endpoint__info">
                <div className="endpoint__title">
                    {countryNameToDisplay}
                </div>
                <div className="endpoint__desc">
                    {cityNameToDisplay}
                </div>
            </div>
            {renderPing()}
        </div>
    );
});

export default CurrentEndpoint;
