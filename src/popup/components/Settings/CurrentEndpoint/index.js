import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import './endpoint.pcss';

const CurrentEndpoint = observer((props) => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const {
        countryNameToDisplay,
        cityNameToDisplay,
        countryCodeToDisplay,
    } = vpnStore;
    const { proxyEnabled } = settingsStore;
    const { handle } = props;

    const iconClass = classnames('flag', { 'flag--active': proxyEnabled });

    const getFlagIconStyle = (countryCode) => {
        if (!countryCode) {
            return {};
        }
        const iconName = countryCode.toLowerCase();
        return { backgroundImage: `url("../../assets/images/flags/${iconName}.svg")` };
    };

    return (
        <div
            className="endpoint"
            onClick={handle}
        >
            <div className="endpoint__country">
                <div className={iconClass}>
                    <span className="flag__icon" style={getFlagIconStyle(countryCodeToDisplay)} />
                </div>
            </div>
            <div className="endpoint__info">
                <div className="endpoint__title">
                    {cityNameToDisplay}
                </div>
                <div className="endpoint__desc">
                    {countryNameToDisplay}
                </div>
            </div>
        </div>
    );
});

export default CurrentEndpoint;
