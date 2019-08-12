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
import { mapStore } from '../../stores';

const mapStyles = {
    width: '90%',
    margin: '0 auto',
    display: 'block',
    height: 'auto',
};

@observer
class Map extends Component {
    async componentDidMount() {
        await mapStore.fetchEndpoints();
    }

    renderMarkers = (endpoints) => {
        if (!endpoints) {
            return '';
        }

        const markers = Object.values(endpoints).map(({ coordinates, id }) => {
            if (coordinates) {
                return { coordinates, id };
            }
            return null;
        }).filter(i => i);

        if (!markers) {
            return '';
        }

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
                    </Marker>
                ))}
            </Markers>
        );
    };

    render() {
        const { endpoints, selectedEndpoint } = mapStore;
        const center = (selectedEndpoint && selectedEndpoint.coordinates) || [0, 0];
        return (
            <div>
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
                                    {(geos, proj) => geos.map((geo, i) => (
                                        <Geography
                                            key={geo.id + i}
                                            geography={geo}
                                            projection={proj}
                                            style={{
                                                default: { fill: '#CFD8DC' },
                                            }}
                                        />
                                    ))
                                    }
                                </Geographies>
                                {this.renderMarkers(endpoints)}
                            </ZoomableGlobe>
                        </ComposableMap>
                    )}
                </Motion>
            </div>
        );
    }
}

export default Map;
