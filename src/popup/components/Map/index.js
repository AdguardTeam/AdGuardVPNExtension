import React, { Component } from 'react';
import './map.pcss';

class Map extends Component {
    render() {
        return (
            <div className="map">
                <div className="current-status">Secure tunnel is enabled</div>
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
