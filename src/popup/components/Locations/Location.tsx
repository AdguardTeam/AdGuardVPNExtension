import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { type LocationData } from '../../stores/VpnStore';
import { Ping } from '../Ping';
import { PingDotsLoader } from '../PingDotsLoader';
import { Icon } from '../ui/Icon';

/**
 * Location component props.
 */
interface LocationProps {
    /**
     * Location data.
     */
    location: LocationData;

    /**
     * Click handler.
     */
    onClick: (id: string) => void;

    /**
     * Save click handler.
     */
    onSaveClick: (id: string) => void;
}

/**
 * Location component.
 */
export const Location = observer(({ location, onClick, onSaveClick }: LocationProps) => {
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
        saved,
    } = location;

    const locationFitsPremiumToken = vpnStore.isPremiumToken || !premiumOnly;

    const virtualText = translator.getMessage('endpoints_location_virtual');
    const offlineText = translator.getMessage('offline_title');

    let computedCityName = cityName;
    if (virtual) {
        computedCityName = `${cityName} (${virtualText})`;
    }

    let pingText = '...';
    if (!available) {
        pingText = offlineText;
    } else if (ping) {
        pingText = `${ping} ms`;
    }

    const title = `${countryName} - ${computedCityName}: ${pingText}`;

    const handleLocationClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (locationFitsPremiumToken) {
            onClick(id);
        } else {
            settingsStore.setPremiumLocationClickedByFreeUser(true);
        }
    };

    const handleSaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onSaveClick(id);
    };

    const endpointItemClass = classnames(
        'endpoint',
        'endpoint--re-designed',
        'endpoints__item',
        { 'endpoint--active': selected },
        { 'endpoint--saved': saved },
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

        const getFlagIconStyle = (countryCode: string) => {
            if (!countryCode) {
                return {};
            }
            const iconName = countryCode.toLowerCase();
            return { backgroundImage: `url("../../assets/images/flags/${iconName}.svg")` };
        };

        return (
            <div className={flagClass} style={getFlagIconStyle(countryCode)} />
        );
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
                    <span>{offlineText}</span>
                </div>
            );
        }

        if (ping) {
            return <Ping ping={ping} selected={selected} />;
        }

        return renderPingDotsLoader();
    };

    const renderSaveButton = () => {
        // Do not render as button, because it descends from
        // button element, which may error in console from React.

        return (
            <div
                className="endpoint__save-btn"
                onClick={handleSaveClick}
            >
                <Icon
                    icon={saved ? 'bookmark-on' : 'bookmark-off'}
                    className="endpoint__save-btn-icon"
                />
            </div>
        );
    };

    return (
        <button
            type="button"
            className={endpointItemClass}
            title={title}
            onClick={handleLocationClick}
        >
            <div className="endpoint__info">
                {renderLocationIcon(countryCode)}
                <div className="endpoint__location-container">
                    <div className={titleClass}>
                        {countryName}
                    </div>
                    <div className="endpoint__location-name endpoint__desc">
                        {computedCityName}
                    </div>
                </div>
            </div>

            <div className="endpoint__ping-container">
                {renderSaveButton()}
                {renderLocationPing()}
            </div>
        </button>
    );
});
