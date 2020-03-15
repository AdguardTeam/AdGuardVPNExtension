import React, { useContext, useEffect } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import './endpoint.pcss';

const CurrentEndpoint = observer((props) => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const updatePing = () => {
        const UPDATE_INTERVAL = 1000;
        // first time get immediately
        settingsStore.getProxyPing();

        // get once per specified update interval
        const intervalId = setInterval(async () => {
            await settingsStore.getProxyPing();
        }, UPDATE_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    };

    useEffect(() => {
        return updatePing();
    }, []);

    const {
        countryNameToDisplay,
        cityNameToDisplay,
        countryCodeToDisplay,
    } = vpnStore;
    const { proxyEnabled } = settingsStore;
    const { handle } = props;

    const iconClass = classnames('flag', { 'flag--active': proxyEnabled });
    const iconName = (countryCodeToDisplay && countryCodeToDisplay.toLowerCase()) || '';

    return (
        <div
            className="endpoint"
            onClick={handle}
        >
            <div className="endpoint__country">
                <div className={iconClass}>
                    <span className={`flag__icon flag__icon--${iconName}`} />
                </div>
            </div>
            <div className="endpoint__info">
                <div className="endpoint__title">
                    {cityNameToDisplay}
                </div>
                <div className="endpoint__desc">
                    {countryNameToDisplay}
                </div>
            </div>
        </div>
    );
});

export default CurrentEndpoint;
