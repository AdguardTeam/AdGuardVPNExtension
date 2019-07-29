import React, { Component } from 'react';
import './map.pcss';

class Map extends Component {
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
                    <label htmlFor="pet-select">Change location</label>
                    <select id="pet-select">
                        <option value="dog">Russia</option>
                        <option value="cat">England</option>
                        <option value="hamster">Netherlands</option>
                        <option value="parrot">Germany</option>
                        <option value="spider">Australia</option>
                    </select>
                </div>
            </div>
        );
    }
}

export default Map;
