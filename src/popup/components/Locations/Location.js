import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import Ping from '../Ping';
import { rootStore } from '../../stores';

const Location = observer(({ location, handleClick }) => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const {
        id,
        selected,
        countryCode,
        countryName,
        cityName,
        ping,
        available,
        premiumOnly,
        virtual,
    } = location;

    const locationFitsPremiumToken = vpnStore.isPremiumToken || !premiumOnly;

    const handleLocationClick = (e) => {
        e.preventDefault();
        if (locationFitsPremiumToken) {
            handleClick(id);
        } else {
            settingsStore.setPremiumLocationClickedByFreeUser(true);
        }
    };

    const renderLocationIcon = (selected, countryCode) => {
        if (!locationFitsPremiumToken) {
            return (
                <div className="lock">
                    <span className="lock__icon" />
                </div>
            );
        }

        const flagClass = classnames(
            'flag flag--small',
            { 'flag--active': selected },
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
        { 'endpoints__item--offline': !available },
    );

    const renderPings = () => {
        if (!available) {
            return (
                <div className="ping">
                    <span>{reactTranslator.getMessage('offline_title')}</span>
                </div>
            );
        }

        if (ping) {
            return <Ping ping={ping} />;
        }

        return (
            <div className="ping">
                <span className="endpoints__dots">
                    <span className="endpoints__dot">.</span>
                    <span className="endpoints__dot">.</span>
                    <span className="endpoints__dot">.</span>
                </span>
            </div>
        );
    };

    return (
        <button
            type="button"
            className={locationClassName}
            onClick={handleLocationClick}
        >
            <div className="endpoints__icon">
                {renderLocationIcon(selected, countryCode)}
            </div>
            <div className="endpoints__name">
                <div className="endpoints__country">
                    {countryName}
                </div>
                <div className="endpoints__city">
                    {cityName}
                    {virtual && ` (${reactTranslator.getMessage('endpoints_location_virtual')})`}
                </div>
            </div>
            {renderPings()}
        </button>
    );
});

export default Location;
