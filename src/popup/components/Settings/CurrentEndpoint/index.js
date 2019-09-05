import React, { useContext, useEffect } from 'react';
import './endpoint.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const CurrentEndpoint = observer((props) => {
    const { endpointsStore, settingsStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await endpointsStore.getSelectedEndpoint();
        })();
        const intervalId = setInterval(async () => {
            await settingsStore.getProxyPing();
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const renderStatus = () => {
        if (!settingsStore.extensionEnabled) {
            return 'Disabled';
        }
        if (settingsStore.ping) {
            return `Ping ${settingsStore.ping} ms`;
        }
        return 'Connecting...';
    };

    // TODO [maximtop] get default city name
    const selectedEndpoint = (endpointsStore.selectedEndpoint && endpointsStore.selectedEndpoint.cityName) || 'default city';
    const { handle } = props;
    return (
        <div className="endpoint">
            <button
                type="button"
                className="button endpoint__btn"
                onClick={handle}
            >
                {selectedEndpoint}
            </button>
            <div className="endpoint__status">
                {renderStatus()}
            </div>
        </div>
    );

});

export default CurrentEndpoint;
