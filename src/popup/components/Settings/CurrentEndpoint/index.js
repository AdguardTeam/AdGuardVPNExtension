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

        return () => {
            clearInterval(intervalId);
        };
    };

    useEffect(() => {
        return updatePing();
    }, []);

    const endpointStatus = classnames({
        'endpoint__status--disabled': !settingsStore.displayEnabled,
        'endpoint__status--success': settingsStore.displayEnabled,
    });

    const renderStatus = () => {
        if (!settingsStore.switcherEnabled) {
            return 'Disabled';
        }
        if (settingsStore.ping) {
            return `Ping ${settingsStore.ping} ms`;
        }
        return 'Connecting...';
    };

    const { countryNameToDisplay, cityNameToDisplay } = vpnStore;
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
