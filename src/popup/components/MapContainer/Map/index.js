import React, { useContext } from 'react';
import {
    ComposableMap,
    ZoomableGlobe,
    Geographies,
    Geography,
} from 'react-simple-maps';
import { observer } from 'mobx-react';
import nanoid from 'nanoid';
import { toJS } from 'mobx';
import renderCityMarkers from './renderCityMarkers';
import Tooltip from '../Tooltip';
import jsonMap from './110m.json';
import rootStore from '../../../stores';
import './map.pcss';

const Map = observer(() => {
    const {
        vpnStore, tooltipStore, settingsStore, uiStore,
    } = useContext(rootStore);

    const onMarkerClick = (e) => {
        tooltipStore.openTooltip(e);
    };

    const onGlobeMoveStart = () => {
        tooltipStore.closeTooltip();
    };

    const onGlobeMoveEnd = (coordinates) => {
        tooltipStore.setMapCoordinates(coordinates);
    };

    const disableEvent = (e) => {
        e.stopPropagation();
    };

    const disableWhileConnecting = uiStore.isConnecting ? disableEvent : undefined;

    const { displayEnabled } = settingsStore;

    const mapStyles = {
        width: '500px',
        position: 'absolute',
        margin: '0 auto',
        display: 'block',
        height: 'auto',
        backgroundColor: displayEnabled ? '#C5F0FF' : '#E5E5E5',
    };

    const geographyStyleDef = {
        fill: displayEnabled ? '#F0FFF3' : '#F9F9F9',
        stroke: '#BABABA',
        strokeWidth: 0.5,
        outline: 'none',
    };

    let { endpoints, selectedEndpoint } = vpnStore;
    endpoints = toJS(endpoints);
    selectedEndpoint = toJS(selectedEndpoint);

    const determineCenter = (vpnStore, tooltipStore) => {
        const { selectedEndpoint } = vpnStore;
        if (tooltipStore.isTooltipOpen) {
            const { coordinates: [x, y] } = tooltipStore.tooltipContent;
            return [x, y + 3];
        }
        if (!tooltipStore.hasDefaultMapCoordinates) {
            return tooltipStore.mapCoordinates;
        }
        return (selectedEndpoint && selectedEndpoint.coordinates) || [0, 0];
    };

    const center = determineCenter(vpnStore, tooltipStore);
    return (
        <div
            className="map"
            onMouseDownCapture={disableWhileConnecting}
            onClickCapture={disableWhileConnecting}
        >
            <ComposableMap
                width={400}
                height={400}
                projection="orthographic"
                projectionConfig={{ scale: 400 }}
                style={mapStyles}
            >
                <ZoomableGlobe
                    center={center}
                    onMoveStart={onGlobeMoveStart}
                    onMoveEnd={onGlobeMoveEnd}
                >
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
                        {(geos, projection) => geos.map((geo) => (
                            <Geography
                                key={nanoid()}
                                geography={geo}
                                projection={projection}
                                style={{
                                    default: geographyStyleDef,
                                    hover: geographyStyleDef,
                                    pressed: geographyStyleDef,
                                }}
                            />
                        ))}
                    </Geographies>
                    {renderCityMarkers(
                        endpoints,
                        selectedEndpoint,
                        displayEnabled,
                        onMarkerClick
                    )}
                </ZoomableGlobe>
            </ComposableMap>
            <Tooltip />
        </div>
    );
});

export default Map;
