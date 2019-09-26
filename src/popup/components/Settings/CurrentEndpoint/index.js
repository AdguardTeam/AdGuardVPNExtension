import React, { useContext, useEffect } from 'react';
import './endpoint.pcss';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import rootStore from '../../../stores';

const CurrentEndpoint = observer((props) => {
    const { endpointsStore, settingsStore } = useContext(rootStore);

    useEffect(() => {
        (() => {
            endpointsStore.getSelectedEndpoint();
            endpointsStore.getCurrentLocation();
        })();
        const intervalId = setInterval(async () => {
            await settingsStore.getProxyPing();
        }, 1000);
        return () => clearInterval(intervalId);
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

    const { countryNameToDisplay } = endpointsStore;
    const { cityNameToDisplay } = endpointsStore;
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
