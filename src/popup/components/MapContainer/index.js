import React, { Fragment } from 'react';
import Map from './Map';
import SiteInfo from './SiteInfo';

const MapContainer = (props) => {
    const { globalProxyEnabled } = props;
    return (
        <Fragment>
            <SiteInfo />
            <Map globalProxyEnabled={globalProxyEnabled} />
        </Fragment>
    );
};

export default MapContainer;
