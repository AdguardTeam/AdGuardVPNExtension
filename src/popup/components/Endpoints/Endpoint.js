import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

const Endpoint = ({
    id, selected, countryCode, countryName, cityName, handleClick, ping,
}) => {
    const getEndpointIcon = (selected, countryCode) => {
        const flagClass = classnames(
            'flag flag--small',
            { 'flag--active': selected }
        );

        const getFlagIconStyle = (countryCode) => {
            if (!countryCode) {
                return {};
            }
            const iconName = countryCode.toLowerCase();
            return { backgroundImage: `url("../../assets/images/flags/${iconName}.svg")` };
        };

        return (
            <div className={flagClass}>
                <span className="flag__icon" style={getFlagIconStyle(countryCode)} />
            </div>
        );
    };

    const pingIsNotAvailable = ping === 'not_available';

    const endpointClassName = classnames(
        'endpoints__item',
        { 'endpoints__item--selected': selected },
        { 'endpoints__item--offline': pingIsNotAvailable }
    );

    const pingClassName = classnames(
        'endpoints__ping',
        { 'endpoints__ping--warning': ping >= PING_WITH_WARNING },
        { 'endpoints__ping--success': ping < PING_WITH_WARNING }
    );

    return (
        <button
            type="button"
            className={endpointClassName}
            onClick={handleClick(id)}
        >
            <div className="endpoints__icon">
                {getEndpointIcon(selected, countryCode)}
            </div>
            <div className="endpoints__name">
                <div className="endpoints__country">
                    {countryName}
                </div>
                <div className="endpoints__city">
                    {cityName}
                </div>
            </div>
            <div className={pingClassName}>
                {ping ? (
                    <span>
                        {pingIsNotAvailable ? 'Offline' : `${ping} ms`}
                    </span>
                ) : (
                    <span className="endpoints__dots">
                        <span className="endpoints__dot">.</span>
                        <span className="endpoints__dot">.</span>
                        <span className="endpoints__dot">.</span>
                    </span>
                )}
            </div>
        </button>
    );
};

export default Endpoint;
