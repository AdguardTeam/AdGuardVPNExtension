import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Ping } from '../../Ping';
import { reactTranslator } from '../../../../common/reactTranslator';

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

    const clickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        uiStore.openEndpointsSearch();
    };

    const titleClass = classnames('endpoint__title', { 'endpoint__title--connected': isConnected });

    const flagClass = classnames('endpoint__flag', { 'endpoint__flag--active': isConnected });

    const getFlagIconStyle = (countryCode: string) => {
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
            <div className="endpoint__info">
                <div className={flagClass} style={getFlagIconStyle(countryCodeToDisplay)} />
                <div>
                    <div className={titleClass}>
                        {countryNameToDisplay}
                    </div>
                    <div className="endpoint__desc">
                        {cityNameToDisplay}
                    </div>
                </div>
            </div>
            <div className="endpoint__ping">
                {renderPing()}
                {settingsStore.hasLimitExceededError && (
                    <div className="endpoint__limited-speed">
                        {reactTranslator.getMessage('popup_traffic_limited_speed')}
                    </div>
                )}
            </div>
        </div>
    );
});
