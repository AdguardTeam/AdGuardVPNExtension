import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../stores/uiStore';
import './map.pcss';

@observer
class Map extends Component {
    handleChangeLocation() {
        const { openEndpointsSearch } = uiStore;
        setDisplayEndpoints(true);
    }

    renderGlobalStatus(status) {
        const text = status ? 'Secure tunnel is enabled' : 'Secure tunnel is switched off';
        return (<div className="current-status">{text}</div>);
    }

    render() {
        const { globalProxyEnabled } = this.props;
        return (
            <div className="map">
                <h1>Map</h1>
            </div>
        );
    }
}

export default Map;
