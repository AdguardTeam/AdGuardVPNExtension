import React, { Fragment } from 'react';
import Map from './Map';
import SiteInfo from './SiteInfo';

const MapContainer = () => {
    return (
        <Fragment>
            <SiteInfo />
            <Map />
        </Fragment>
    );
};

export default MapContainer;
