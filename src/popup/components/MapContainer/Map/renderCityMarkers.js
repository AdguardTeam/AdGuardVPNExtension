import React, { Fragment } from 'react';
import { Markers, Marker } from 'react-simple-maps';

const CityMarkers = (endpoints, selectedEndpoint, globalProxyEnabled, onMarkerClicked) => {
    if (!endpoints) {
        return null;
    }

    const markers = Object.values(endpoints).map((endpoint) => {
        const { coordinates } = endpoint;
        if (coordinates) {
            return endpoint;
        }
        return null;
    }).filter(i => i);

    if (!markers) {
        return null;
    }

    const renderCityName = (markerId, selectedEndpoint) => {
        if (!selectedEndpoint) {
            return '';
        }
        if (markerId === selectedEndpoint.id) {
            return (
                <text
                    textAnchor="middle"
                    y="25px"
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
                    onClick={onMarkerClicked}
                >
                    {
                        selectedEndpoint && selectedEndpoint.id === marker.id ? (
                            <Fragment>
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={14}
                                    fill={globalProxyEnabled ? '#004C33' : '#323232'}
                                />
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={5}
                                    fill="#F0F0F0"
                                />
                            </Fragment>
                        ) : (
                            <Fragment>
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={12}
                                    fill={globalProxyEnabled ? 'rgba(0, 76, 51, 0.2)' : 'rgba(50, 50, 50, 0.2)'}
                                />
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={6}
                                    fill={globalProxyEnabled ? 'rgba(0, 76, 51, 0.5)' : 'rgba(50, 50, 50, 0.5)'}
                                />
                            </Fragment>
                        )
                    }
                    {renderCityName(marker.id, selectedEndpoint)}
                </Marker>
            ))}
        </Markers>
    );
};

export default CityMarkers;
