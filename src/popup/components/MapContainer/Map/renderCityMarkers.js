import React, { Fragment } from 'react';
import { Markers, Marker } from 'react-simple-maps';
import SignalsAnimation from './SignalsAnimation';
import COLORS from './colors';

const { ENABLED_MARKER_02, ENABLED_MARKER_05, DISABLED_MARKER } = COLORS;

const renderCityMarkers = (endpoints, selectedEndpoint, globalProxyEnabled, onMarkerClicked) => {
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
                        fill: globalProxyEnabled ? COLORS.ENABLED_TEXT : COLORS.DISABLED_TEXT,
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
                                    r={10}
                                    fill={globalProxyEnabled
                                        ? COLORS.SELECTED_ENABLED_MARKER
                                        : COLORS.SELECTED_DISABLED_MARKER}
                                />
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={4}
                                    fill="#F0F0F0"
                                />
                                <SignalsAnimation />
                            </Fragment>
                        ) : (
                            <Fragment>
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={8}
                                    fill={globalProxyEnabled
                                        ? ENABLED_MARKER_02
                                        : DISABLED_MARKER}
                                />
                                <circle
                                    cx={0}
                                    cy={0}
                                    r={4}
                                    fill={globalProxyEnabled
                                        ? ENABLED_MARKER_05
                                        : DISABLED_MARKER}
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

export default renderCityMarkers;
