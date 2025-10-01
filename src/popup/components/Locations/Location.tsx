import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import browser from 'webextension-polyfill';
import classnames from 'classnames';

import { translator } from '../../../common/translator';
import { SearchHighlighter } from '../../../common/components/SearchHighlighter';
import { Icon } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { type LocationData } from '../../stores/VpnStore';
import { Ping } from '../Ping';
import { PingDotsLoader } from '../PingDotsLoader';

/**
 * Style object for flag icon background image.
 */
interface FlagIconStyle {
    /**
     * Background image URL.
     */
    backgroundImage?: string;
}

/**
 * Get flag icon style object by country code.
 *
 * @param countryCode Country code.
 * @returns Flag icon style object with background image,
 * empty object if country code is not provided.
 */
export const getFlagIconStyle = (countryCode: string): FlagIconStyle => {
    if (!countryCode) {
        return {};
    }

    const iconName = countryCode.toLowerCase();
    const fullUrl = browser.runtime.getURL(`assets/images/flags/${iconName}.svg`);

    return { backgroundImage: `url("${fullUrl}")` };
};

/**
 * Location component props.
 */
interface LocationProps {
    /**
     * Location data.
     */
    location: LocationData;

    /**
     * Search value. Used to highlight search results.
     */
    searchValue: string;

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

    const handleLocationClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        if (locationFitsPremiumToken) {
            onClick(id);
        } else {
            settingsStore.setPremiumLocationClickedByFreeUser(true);
        }
    };

    const handleSaveClick = (e: React.MouseEvent<HTMLDivElement>): void => {
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

    const renderLocationIcon = (countryCode: string): ReactElement => {
        if (!locationFitsPremiumToken) {
            return (
                <div className="endpoints__lock-icon" />
            );
        }

        return (
            <div className={flagClass} style={getFlagIconStyle(countryCode)} />
        );
    };

    const renderPingDotsLoader = (): ReactElement => {
        return (
            <div className="ping ping--loader">
                <span className="endpoints__ping-dots-loader">
                    <PingDotsLoader />
                </span>
            </div>
        );
    };

    const renderLocationPing = (): ReactElement => {
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

    const renderSaveButton = (): ReactElement => {
        // Do not render as button, because it descends from
        // button element, which may throw error in console from React.
        // TODO: Consider refactoring top level button

        return (
            <div
                className="endpoint__save-btn"
                onClick={handleSaveClick}
            >
                <Icon name={saved ? 'bookmark-on' : 'bookmark-off'} />
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
                        <SearchHighlighter
                            value={countryName}
                            search={vpnStore.searchValue}
                        />
                    </div>
                    <div className="endpoint__location-name endpoint__desc">
                        <SearchHighlighter
                            value={computedCityName}
                            search={vpnStore.searchValue}
                        />
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
