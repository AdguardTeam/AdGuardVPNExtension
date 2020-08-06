import React from 'react';
import classnames from 'classnames';

import { reactTranslator } from '../../../reactCommon/reactTranslator';
import Ping from '../Ping';

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

    const renderPings = () => {
        if (!available) {
            return (<span>{reactTranslator.translate('offline_title')}</span>);
        }

        if (ping) {
            return <Ping ping={ping} />;
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
            { renderPings() }
        </button>
    );
};

export default Location;
