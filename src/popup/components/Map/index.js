import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../stores/uiStore';
import './map.pcss';

@observer
class Map extends Component {
    handleChangeLocation() {
        const { setShowEndpoints } = uiStore;
        setShowEndpoints(true);
    }

    renderGlobalStatus(status) {
        const text = status ? 'Secure tunnel is enabled' : 'Secure tunnel is switched off';
        return (<div className="current-status">{text}</div>);
    }

    render() {
        const { globalProxyEnabled } = this.props;
        return (
            <div className="map">
                {this.renderGlobalStatus(globalProxyEnabled)}
                <div className="current-location">via Moscow, Russia</div>
                <div className="location-selector">
                    <div
                        className="button change-location"
                        role="button"
                        tabIndex="0"
                        onClick={this.handleChangeLocation}
                    >
                        Change location
                    </div>
                </div>
            </div>
        );
    }
}

export default Map;
