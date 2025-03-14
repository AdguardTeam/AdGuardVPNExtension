import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { type LocationData } from '../../stores/VpnStore';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';

import { FastestSkeleton } from './FastestSkeleton';
import { Location } from './Location';
import { Search } from './Search';
import { Reload } from './Reload';

import './endpoints.pcss';

export const Locations = observer(() => {
    const {
        vpnStore,
        uiStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    const isSearchTelemetrySent = useRef(false);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.LocationsScreen,
    );

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

    const handleLocationsClose = () => {
        uiStore.closeEndpointsSearch();
        vpnStore.setSearchValue('');
    };

    const renderLocations = (locations: LocationData[]) => locations.map((location) => {
        return (
            <Location
                key={location.id}
                handleClick={handleLocationSelect}
                location={location}
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
        const {
            filteredLocations,
            showSearchResults,
        } = vpnStore;

        const emptySearchResults = showSearchResults && filteredLocations.length === 0;
        let listTitle = 'endpoints_all';

        if (showSearchResults && filteredLocations.length > 0) {
            listTitle = 'endpoints_search_results';
        }

        if (emptySearchResults) {
            return (
                <div className="endpoints__not-found">
                    <div className="endpoints__not-found--icon" />
                    <div className="endpoints__title endpoints__not-found--title">
                        {reactTranslator.getMessage('endpoints_not_found')}
                    </div>
                </div>
            );
        }

        return (
            <div className="endpoints__list">
                <div className="endpoints__title">
                    {reactTranslator.getMessage(listTitle)}
                    {!showSearchResults && (
                        <>
                            &nbsp;
                            {`(${filteredLocations.length})`}
                        </>
                    )}
                </div>
                {renderLocations(filteredLocations)}
            </div>
        );
    };

    const {
        fastestLocationsToDisplay,
        showSearchResults,
    } = vpnStore;

    return (
        <div className="endpoints">
            <div className="endpoints__header">
                {reactTranslator.getMessage('endpoints_countries')}
                <button
                    type="button"
                    className="button endpoints__back"
                    onClick={handleLocationsClose}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#back" />
                    </svg>
                </button>
                <Reload />
            </div>
            <Search
                value={vpnStore.searchValue}
                onChange={handleSearchInput}
                onClear={handleSearchClear}
            />
            <div className="endpoints__scroll">
                {!showSearchResults && (
                    <div className="endpoints__list">
                        <div className="endpoints__title">
                            {reactTranslator.getMessage('endpoints_fastest')}
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
        </div>
    );
});
