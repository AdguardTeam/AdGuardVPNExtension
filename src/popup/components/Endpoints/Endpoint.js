import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

const Endpoint = ({
<<<<<<< HEAD
    id, selected, countryCode, city, country, handleClick, ping,
=======
    id, selected, countryCode, countryName, cityName, handleClick, ping,
>>>>>>> bb92aa8197a53c48df13697f1ef8e44f101d2d54
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

    const endpointClassName = classnames(
        'endpoints__item',
        { 'endpoints__item--selected': selected }
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
<<<<<<< HEAD
            <div className="endpoints__location">
                <div className="endpoints__country">
                    {country}
                </div>
                <div className="endpoints__city">
                    {city}
=======
            <div className="endpoints__name">
                <div className="endpoints__country">
                    {countryName}
                </div>
                <div className="endpoints__city">
                    {cityName}
>>>>>>> bb92aa8197a53c48df13697f1ef8e44f101d2d54
                </div>
            </div>
            <div className={pingClassName}>
                {ping ? (
                    <span>
                        {ping}
                        &nbsp;ms
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
