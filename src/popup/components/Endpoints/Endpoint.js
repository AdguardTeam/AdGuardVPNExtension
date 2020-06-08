import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';
import { NOT_AVAILABLE_STATUS } from '../../../lib/constants';
import translator from '../../../lib/translator';

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

    const pingIsNotAvailable = ping === NOT_AVAILABLE_STATUS;

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
                        {pingIsNotAvailable ? translator.translate('offline_title') : `${ping} ms`}
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
