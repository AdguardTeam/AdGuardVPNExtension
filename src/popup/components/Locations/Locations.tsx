import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Location } from './Location';
import { Search } from './Search';
import { Skeleton } from './Skeleton';
import { reactTranslator } from '../../../common/reactTranslator';

import './endpoints.pcss';

export const Locations = observer(() => {
    const { vpnStore, uiStore, settingsStore } = useContext(rootStore);

    const handleLocationSelect = async (id: string) => {
        const prevId = vpnStore.selectedLocation.id;
        await vpnStore.selectLocation(id);
        uiStore.closeEndpointsSearch();

        if ((settingsStore.isConnected
            || settingsStore.isConnectingRetrying
            || settingsStore.isConnectingIdle) && prevId !== vpnStore.selectedLocation.id) {
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

    // FIXME: VpnStore to ts and replace any with proper type
    const renderLocations = (locations: any) => locations.map((location: any) => {
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
                <div className="endpoints__title endpoints__title--not-found">
                    {reactTranslator.getMessage('endpoints_not_found')}
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
        fastestLocations,
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
            </div>
            <Search
                value={vpnStore.searchValue}
                handleChange={handleSearchInput}
                handleClear={handleSearchClear}
            />
            <div className="endpoints__scroll">
                {!showSearchResults && (
                    <div className="endpoints__list">
                        <div className="endpoints__title">
                            {reactTranslator.getMessage('endpoints_fastest')}
                        </div>
                        {fastestLocations.length > 0 ? (
                            renderLocations(fastestLocations)
                        ) : (
                            <Skeleton />
                        )}
                    </div>
                )}

                {renderFilteredEndpoint()}
            </div>
        </div>
    );
});
