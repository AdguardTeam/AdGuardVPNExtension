import React, { useContext, useState } from 'react';
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
import rootStore from '../../stores';
import './map.pcss';

const renderMarkers = (endpoints, selectedEndpoint, globalProxyEnabled) => {
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
                        fill: globalProxyEnabled ? '#004C33' : '#323232',
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
                    <circle cx={0} cy={0} r={6} fill={globalProxyEnabled ? 'rgba(0, 76, 51, 0.5)' : 'rgba(50, 50, 50, 0.5)'} stroke="#FFF" />
                    {renderCityName(marker.id, selectedEndpoint)}
                </Marker>
            ))}
        </Markers>
    );
};


const Map = observer((props) => {
    const { endpointsStore } = useContext(rootStore);
    useState(async () => {
        await endpointsStore.fetchEndpoints();
    });


    const { globalProxyEnabled } = props;
    const mapStyles = {
        width: '500px',
        position: 'absolute',
        margin: '0 auto',
        display: 'block',
        height: 'auto',
        backgroundColor: globalProxyEnabled ? '#C5f0ff' : '#e5e5e5',
    };

    const geographyStyleDef = {
        fill: globalProxyEnabled ? '#F0FFF3' : '#F9F9F9',
        stroke: '#BABABA',
        strokeWidth: 0.5,
        outline: 'none',
    };

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
                                            default: geographyStyleDef,
                                            hover: geographyStyleDef,
                                            pressed: geographyStyleDef,
                                        }}
                                    />
                                ))
                                    }
                            </Geographies>
                            {renderMarkers(endpoints, selectedEndpoint, globalProxyEnabled)}
                        </ZoomableGlobe>
                    </ComposableMap>
                )}
            </Motion>
        </div>
    );
});

export default Map;
