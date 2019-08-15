import React, { Component } from 'react';
import './endpoint.pcss';
import { observer } from 'mobx-react';
import { endpointsStore } from '../../../stores';
import settingsStore from '../../../stores/settingsStore';

@observer
class CurrentEndpoint extends Component {
    async componentDidMount() {
        await endpointsStore.getSelectedEndpoint();
        await settingsStore.startGettingPing();
    }

    renderStatus() {
        if (!settingsStore.extensionEnabled) {
            return 'Disabled';
        }
        if (settingsStore.ping) {
            return `Ping ${settingsStore.ping} ms`;
        }
        return 'Connecting...';
    }

    render() {
        // TODO [maximtop] get default city name
        const selectedEndpoint = (endpointsStore.selectedEndpoint && endpointsStore.selectedEndpoint.cityName) || 'default city';
        const { handle } = this.props;
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
                    {this.renderStatus()}
                </div>
            </div>
        );
    }
}

export default CurrentEndpoint;
