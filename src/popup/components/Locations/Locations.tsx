import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { translator } from '../../../common/translator';
import { type LocationData } from '../../stores/VpnStore';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../background/telemetry';
import { Icon } from '../ui/Icon';

import { FastestSkeleton } from './FastestSkeleton';
import { Location } from './Location';
import { Search } from './Search';
import { Reload } from './Reload';
import { TabButtons } from './TabButtons';

import './endpoints.pcss';

export const Locations = observer(() => {
    const {
        vpnStore,
        uiStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

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
            // FIXME: Add undo snackbar
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
                location={location}
                onClick={handleLocationSelect}
                onSaveClick={handleLocationSave}
            />
        );
    });

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
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
                handleChange={handleSearchInput}
                handleClear={handleSearchClear}
            />
            <TabButtons />
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
        </div>
    );
});
