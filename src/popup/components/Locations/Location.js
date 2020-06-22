import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Location = ({
    id, selected, countryCode, countryName, cityName, handleClick, ping, available,
}) => {
    const getLocationIcon = (selected, countryCode) => {
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

    const locationClassName = classnames(
        'endpoints__item',
        { 'endpoints__item--selected': selected },
        { 'endpoints__item--offline': !available }
    );

    const pingClassName = classnames(
        'endpoints__ping',
        { 'endpoints__ping--warning': available && ping >= PING_WITH_WARNING },
        { 'endpoints__ping--success': available && ping < PING_WITH_WARNING }
    );

    const renderPings = () => {
        if (!available) {
            return (<span>{reactTranslator.translate('offline_title')}</span>);
        }

        if (ping) {
            return (<span>{`${ping} ms`}</span>);
        }

        return (
            <span className="endpoints__dots">
                <span className="endpoints__dot">.</span>
                <span className="endpoints__dot">.</span>
                <span className="endpoints__dot">.</span>
            </span>
        );
    };

    return (
        <button
            type="button"
            className={locationClassName}
            onClick={handleClick(id)}
        >
            <div className="endpoints__icon">
                {getLocationIcon(selected, countryCode)}
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
                { renderPings() }
            </div>
        </button>
    );
};

export default Location;
