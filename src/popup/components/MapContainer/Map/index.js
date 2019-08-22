import React, { useContext, useEffect } from 'react';
import {
    ComposableMap,
    ZoomableGlobe,
    Geographies,
    Geography,
} from 'react-simple-maps';
import { Motion, spring } from 'react-motion';
import { observer } from 'mobx-react';
import renderCityMarkers from './renderCityMarkers';
import Tooltip from '../Tooltip';
import jsonMap from './110m.json';
import rootStore from '../../../stores';
import './map.pcss';

const Map = observer((props) => {
    const { endpointsStore, tooltipStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await endpointsStore.fetchEndpoints();
        })();
    }, []);

    const onMarkerClick = (e) => {
        // TODO [maximtop] center map
        tooltipStore.openTooltip();
    };

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
                            {renderCityMarkers(
                                endpoints,
                                selectedEndpoint,
                                globalProxyEnabled,
                                onMarkerClick
                            )
                            }
                        </ZoomableGlobe>
                    </ComposableMap>
                )}
            </Motion>
            <Tooltip />
        </div>
    );
});

export default Map;
