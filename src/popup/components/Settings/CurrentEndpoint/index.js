import React, { useContext, useEffect } from 'react';
import './endpoint.pcss';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import rootStore from '../../../stores';

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

        const onUnmount = () => {
            clearInterval(intervalId);
        };

        return onUnmount;
    };

    useEffect(() => {
        (() => {
            vpnStore.getSelectedEndpoint();
            vpnStore.getCurrentLocation();
        })();

        const onUnmount = updatePing();

        return onUnmount;
    }, []);

    const endpointStatus = classnames({
        'endpoint__status--disabled': !settingsStore.extensionEnabled,
        'endpoint__status--success': settingsStore.ping,
    });

    const renderStatus = () => {
        if (!settingsStore.extensionEnabled) {
            return 'Disabled';
        }
        if (settingsStore.ping) {
            return `Ping ${settingsStore.ping} ms`;
        }
        return 'Connecting...';
    };

    const { countryNameToDisplay } = vpnStore;
    const { cityNameToDisplay } = vpnStore;
    const { handle } = props;
    return (
        <div className="endpoint">
            <button
                type="button"
                className="button endpoint__btn"
                onClick={handle}
            >
                {countryNameToDisplay}
            </button>
            <div className="endpoint__desc">
                {cityNameToDisplay}
            </div>
            <div className={`endpoint__status ${endpointStatus}`}>
                {renderStatus()}
            </div>
        </div>
    );
});

export default CurrentEndpoint;
