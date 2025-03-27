import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { translator } from '../../../common/translator';
import { type LocationData } from '../../stores/VpnStore';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';
import { Icon } from '../ui/Icon';

import { FastestSkeleton } from './FastestSkeleton';
import { Location } from './Location';
import { Search } from './Search';
import { Reload } from './Reload';
import { TabButtons } from './TabButtons';

import './endpoints.pcss';

/**
 * Duration of the notification that appears when a location is deleted in milliseconds.
 */
const DELETED_NOTIFICATION_DURATION_MS = 3000;

export const Locations = observer(() => {
    const {
        vpnStore,
        uiStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    const isSearchTelemetrySent = useRef(false);

    const deletedNotificationTimeout = useRef<NodeJS.Timeout>();
    const [lastUnsavedLocation, setLastUnsavedLocation] = useState<string | null>(null);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LocationsScreen,
    );

    const {
        filteredLocations,
        fastestLocationsToDisplay,
        showSearchResults,
        isSavedLocationsTab,
        notSearchingAndSavedTab,
    } = vpnStore;

    const handleLocationSelect = async (id: string) => {
        const prevId = vpnStore.selectedLocation?.id;
        await vpnStore.selectLocation(id);
        uiStore.closeEndpointsSearch();

        if ((settingsStore.isConnected
            || settingsStore.isConnectingRetrying
            || settingsStore.isConnectingIdle) && prevId !== vpnStore.selectedLocation?.id) {
            await settingsStore.reconnectProxy();
            return;
        }

        if (!settingsStore.isConnected) {
            await settingsStore.setProxyState(true);
        }
    };

    const handleLocationSave = async (id: string) => {
        const isAdded = await vpnStore.toggleSavedLocation(id);

        if (!isAdded) {
            clearTimeout(deletedNotificationTimeout.current);
            setLastUnsavedLocation(id);

            deletedNotificationTimeout.current = setTimeout(() => {
                setLastUnsavedLocation(null);
            }, DELETED_NOTIFICATION_DURATION_MS);
        }
    };

    const handleNotificationUndo = () => {
        if (lastUnsavedLocation) {
            vpnStore.addSavedLocation(lastUnsavedLocation);
            setLastUnsavedLocation(null);
        }
    };

    const handleNotificationClose = () => {
        setLastUnsavedLocation(null);
        clearTimeout(deletedNotificationTimeout.current);
    };

    const handleLocationsClose = () => {
        uiStore.closeEndpointsSearch();
        vpnStore.setSearchValue('');
    };

    const renderLocations = (locations: LocationData[]) => locations.map((location) => {
        return (
            <Location
                key={location.id}
                location={location}
                searchValue={vpnStore.searchValue}
                onClick={handleLocationSelect}
                onSaveClick={handleLocationSave}
            />
        );
    });

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        // Telemetry event should be sent only once
        // when user starts typing in the search field.
        // NOTE: State will be reset when this component is unmounted.
        if (!isSearchTelemetrySent.current) {
            isSearchTelemetrySent.current = true;
            telemetryStore.sendCustomEvent(
                TelemetryActionName.SearchLocationsClick,
                TelemetryScreenName.LocationsScreen,
            );
        }

        vpnStore.setSearchValue(value);
    };

    const handleSearchClear = () => {
        vpnStore.setSearchValue('');
    };

    const renderFilteredEndpoint = () => {
        const emptySearchResults = showSearchResults && filteredLocations.length === 0;
        if (emptySearchResults) {
            return (
                <div className="endpoints__not-found">
                    <div className="endpoints__not-found-icon" />
                    <div className="endpoints__title endpoints__not-found-title">
                        {translator.getMessage('endpoints_not_found')}
                    </div>
                </div>
            );
        }

        const emptySavedLocations = isSavedLocationsTab && filteredLocations.length === 0;
        if (emptySavedLocations) {
            return (
                <div className="endpoints__empty-saved">
                    <Icon icon="bookmark-off-thin" className="endpoints__empty-saved-icon" />
                    <div className="endpoints__empty-saved-title">
                        {reactTranslator.getMessage('endpoints_empty_saved')}
                    </div>
                </div>
            );
        }

        return (
            <div className="endpoints__list">
                {notSearchingAndSavedTab && (
                    <div className="endpoints__title">
                        {translator.getMessage('endpoints_all')}
                        &nbsp;
                        {`(${filteredLocations.length})`}
                    </div>
                )}
                {renderLocations(filteredLocations)}
            </div>
        );
    };

    return (
        <div className="endpoints">
            <div className="endpoints__header">
                {translator.getMessage('endpoints_countries')}
                <button
                    type="button"
                    className="button endpoints__back"
                    onClick={handleLocationsClose}
                >
                    <Icon icon="back" className="icon--button" />
                </button>
                <Reload />
            </div>
            <Search
                value={vpnStore.searchValue}
                onChange={handleSearchInput}
                onClear={handleSearchClear}
            />
            {!showSearchResults && <TabButtons />}
            <div className="endpoints__scroll">
                {notSearchingAndSavedTab && (
                    <div className="endpoints__list">
                        <div className="endpoints__title">
                            {translator.getMessage('endpoints_fastest')}
                        </div>
                        {fastestLocationsToDisplay.length > 0 ? (
                            renderLocations(fastestLocationsToDisplay)
                        ) : (
                            <FastestSkeleton />
                        )}
                    </div>
                )}

                {renderFilteredEndpoint()}
            </div>

            {lastUnsavedLocation && (
                <div className="endpoints__notification">
                    <div className="endpoints__notification-wrapper">
                        <Icon
                            icon="info"
                            className="endpoints__notification-icon"
                        />
                        <div className="endpoints__notification-content">
                            <div className="endpoints__notification-title">
                                {translator.getMessage('endpoints_saved_location_deleted')}
                            </div>
                            <button
                                type="button"
                                className="endpoints__notification-undo"
                                onClick={handleNotificationUndo}
                            >
                                {translator.getMessage('settings_exclusions_undo')}
                            </button>
                        </div>
                        <button
                            type="button"
                            className="endpoints__notification-close"
                            onClick={handleNotificationClose}
                        >
                            <Icon
                                icon="cross"
                                className="endpoints__notification-close-icon icon--button"
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
