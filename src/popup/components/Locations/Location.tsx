import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import browser from 'webextension-polyfill';
import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { type LocationData } from '../../stores/VpnStore';
import { Ping } from '../Ping';
import { PingDotsLoader } from '../PingDotsLoader';

/**
 * Get flag icon style object by country code.
 *
 * @param countryCode Country code.
 * @returns Flag icon style object with background image,
 * empty object if country code is not provided.
 */
export const getFlagIconStyle = (countryCode: string) => {
    if (!countryCode) {
        return {};
    }

    const iconName = countryCode.toLowerCase();
    const fullUrl = browser.runtime.getURL(`assets/images/flags/${iconName}.svg`);

    return { backgroundImage: `url("${fullUrl}")` };
};

type LocationProps = {
    location: LocationData,
    handleClick: Function,
};

export const Location = observer(({ location, handleClick }: LocationProps) => {
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

    const handleLocationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (locationFitsPremiumToken) {
            handleClick(id);
        } else {
            settingsStore.setPremiumLocationClickedByFreeUser(true);
        }
    };

    const endpointItemClass = classnames(
        'endpoint',
        'endpoints__item',
        { 'endpoint--active': selected },
        { 'endpoints__item--offline': !available },
    );

    const flagClass = classnames(
        'endpoint__flag',
        { 'endpoint__flag--active': selected },
    );

    const titleClass = classnames(
        'endpoint__location-name',
        'endpoint__title',
        { 'endpoint__title--selected': selected },
    );

    const renderLocationIcon = (countryCode: string) => {
        if (!locationFitsPremiumToken) {
            return (
                <div className="endpoints__lock-icon" />
            );
        }

        return (
            <div className={flagClass} style={getFlagIconStyle(countryCode)} />
        );
    };

    const renderCityName = () => {
        if (!virtual) {
            return cityName;
        }

        return `${cityName} (${reactTranslator.getMessage('endpoints_location_virtual')})`;
    };

    const renderPingDotsLoader = () => {
        return (
            <div className="ping">
                <span className="endpoints__ping-dots-loader">
                    <PingDotsLoader />
                </span>
            </div>
        );
    };

    const renderLocationPing = () => {
        if (settingsStore.arePingsRecalculating) {
            return renderPingDotsLoader();
        }

        if (!available) {
            return (
                <div className="ping">
                    <span>{reactTranslator.getMessage('offline_title')}</span>
                </div>
            );
        }

        if (ping) {
            return <Ping ping={ping} selected={selected} />;
        }

        return renderPingDotsLoader();
    };

    return (
        <button
            type="button"
            className={endpointItemClass}
            onClick={handleLocationClick}
        >
            <div className="endpoint__info">
                {renderLocationIcon(countryCode)}
                <div className="endpoint__location-container endpoint__location-container--wide">
                    <div className={titleClass}>
                        {countryName}
                    </div>
                    <div className="endpoint__location-name endpoint__desc">
                        {renderCityName()}
                    </div>
                </div>
            </div>

            <div className="endpoint__ping-container">
                {renderLocationPing()}
            </div>

        </button>
    );
});
