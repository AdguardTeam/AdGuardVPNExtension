import React, { useContext } from 'react';
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

    const clickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        uiStore.openLocationsScreen();
    };

    const titleClass = classnames('endpoint__location-name', 'endpoint__title', { 'endpoint__title--selected': isConnected });

    const flagClass = classnames('endpoint__flag', { 'endpoint__flag--active': isConnected });

    const renderPing = () => {
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

export interface CurrentEndpointScreenShotProps {
    /**
     * Two letter country code, case insensitive, example: "DE".
     * Used to display flag image.
     * To see available list of countries, check `src/assets/images/flags` directory.
     */
    countryCode: string;

    /**
     * Country name, example: "Germany".
     */
    countryName: string;

    /**
     * City name, example: "Berlin".
     */
    cityName: string;
}

/**
 * Component is used as part of the ScreenShot component
 * to render the CurrentEndpoint as static non-interactive element.
 *
 * See `ScreenShot.tsx` for more details.
 */
export const CurrentEndpointScreenShot = ({
    countryCode,
    countryName,
    cityName,
}: CurrentEndpointScreenShotProps) => (
    <div className="endpoint__current">
        <button type="button" className="endpoint">
            <div className="endpoint__info">
                <div className="endpoint__flag" style={getFlagIconStyle(countryCode)} />
                <div className="endpoint__location-container">
                    <div className="endpoint__location-name endpoint__title">
                        {countryName}
                    </div>
                    <div className="endpoint__location-name endpoint__desc">
                        {cityName}
                    </div>
                </div>
            </div>
            <div className="endpoint__ping-container">
                <div>
                    <div className="ping">—</div>
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
