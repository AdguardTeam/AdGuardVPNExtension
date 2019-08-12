import React, { Component } from 'react';
import {
    ComposableMap,
    ZoomableGlobe,
    Geographies,
    Geography,
    Marker,
    Markers,
} from 'react-simple-maps';
import { Motion, spring } from 'react-motion';
import { observer } from 'mobx-react';
import jsonMap from './110m.json';
import { endpointsStore } from '../../stores';
import './map.pcss';

const mapStyles = {
    width: '500px',
    position: 'absolute',
    margin: '0 auto',
    display: 'block',
    height: 'auto',
};

const renderMarkers = (endpoints, selectedEndpoint) => {
    if (!endpoints) {
        return '';
    }

    const markers = Object.values(endpoints).map((endpoint) => {
        const { coordinates } = endpoint;
        if (coordinates) {
            return endpoint;
        }
        return null;
    }).filter(i => i);

    if (!markers) {
        return '';
    }

    const renderCityName = (markerId, selectedEndpoint) => {
        if (!selectedEndpoint) {
            return '';
        }
        if (markerId === selectedEndpoint.id) {
            return (
                <text
                    textAnchor="middle"
                    y="20px"
                    style={{
                        fontFamily: 'Roboto, sans-serif',
                        fill: '#607D8B',
                    }}
                >
                    {selectedEndpoint.cityName}
                </text>
            );
        }
        return '';
    };

    return (
        <Markers>
            {markers.map(marker => (
                <Marker
                    key={marker.id}
                    marker={marker}
                    style={{
                        hidden: { display: 'none' },
                    }}
                >
                    <circle cx={0} cy={0} r={6} fill="#FF5722" stroke="#FFF" />
                    {renderCityName(marker.id, selectedEndpoint)}
                </Marker>
            ))}
        </Markers>
    );
};

@observer
class Map extends Component {
    async componentDidMount() {
        await endpointsStore.fetchEndpoints();
    }

    render() {
        const { endpoints, selectedEndpoint } = endpointsStore;
        const center = (selectedEndpoint && selectedEndpoint.coordinates) || [0, 0];
        return (
            <div className="map">
                <Motion
                    defaultStyle={{
                        x: center[0],
                        y: center[1],
                    }}
                    style={{
                        x: spring(center[0]),
                        y: spring(center[1]),
                    }}
                >
                    {({ x, y }) => (
                        <ComposableMap
                            width={400}
                            height={400}
                            projection="orthographic"
                            projectionConfig={{ scale: 200 }}
                            style={mapStyles}
                        >
                            <ZoomableGlobe center={[x, y]}>
                                <circle
                                    cx={200}
                                    cy={200}
                                    r={200}
                                    fill="transparent"
                                    stroke="#CFD8DC"
                                />
                                <Geographies
                                    disableOptimization
                                    geography={jsonMap}
                                >
                                    {(geos, projection) => geos.map((geo, i) => (
                                        <Geography
                                            key={`geography-${i}`}
                                            geography={geo}
                                            projection={projection}
                                            style={{
                                                default: { fill: '#CFD8DC' },
                                            }}
                                        />
                                    ))
                                    }
                                </Geographies>
                                {renderMarkers(endpoints, selectedEndpoint)}
                            </ZoomableGlobe>
                        </ComposableMap>
                    )}
                </Motion>
            </div>
        );
    }
}

export default Map;
