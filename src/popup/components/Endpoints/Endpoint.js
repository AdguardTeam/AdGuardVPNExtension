import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

const Endpoint = ({
    id, selected, countryCode, name, handleClick, ping,
}) => {
    const getEndpointIcon = (selected, countryCode) => {
        const icon = (countryCode && countryCode.toLowerCase()) || '';
        const flagClass = classnames(
            'flag flag--small',
            { 'flag--active': selected }
        );
        const flagIconClass = classnames(
            'flag__icon',
            { [`flag__icon--${icon}`]: icon }
        );

        return (
            <div className={flagClass}>
                <span className={flagIconClass} />
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
            <div className="endpoints__city">
                {name}
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
