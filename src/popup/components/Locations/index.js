import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import translator from '../../../lib/translator/translator';
import rootStore from '../../stores';
import Location from './Location';
import Search from './Search';
import Skeleton from './Skeleton';

import './endpoints.pcss';

const Locations = observer(() => {
    const { vpnStore, uiStore, settingsStore } = useContext(rootStore);

    const handleLocationSelect = (id) => async (e) => {
        e.preventDefault();
        const prevId = vpnStore.selectedLocation.id;
        await vpnStore.selectLocation(id);
        uiStore.closeEndpointsSearch();
        if (settingsStore.proxyEnabled && prevId !== vpnStore.selectedLocation.id) {
            await settingsStore.reconnectProxy();
            return;
        }
        if (!settingsStore.proxyEnabled) {
            await settingsStore.setProxyState(true);
        }
    };

    const handleLocationsClose = () => {
        uiStore.closeEndpointsSearch();
        vpnStore.setSearchValue('');
    };

    const renderLocations = (locations) => locations.map((location) => {
        const {
            id,
            countryName,
            selected,
            cityName,
            countryCode,
            ping,
            available,
        } = location;

        return (
            <Location
                key={id}
                id={id}
                handleClick={handleLocationSelect}
                selected={selected}
                countryCode={countryCode}
                countryName={countryName}
                cityName={cityName}
                ping={ping}
                available={available}
            />
        );
    });

    const handleSearchInput = (e) => {
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
                <>
                    <div className="endpoints__not-found" />
                    <div className="endpoints__title endpoints__title--big">
                        {translator.translate('endpoints_not_found')}
                    </div>
                </>
            );
        }

        return (
            <div className="endpoints__list">
                <div className="endpoints__title">
                    {translator.translate(listTitle)}
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
                {translator.translate('endpoints_countries')}
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
                    <>
                        <div className="endpoints__list">
                            <div className="endpoints__title">
                                {translator.translate('endpoints_fastest')}
                            </div>
                            {fastestLocations.length > 0 ? (
                                renderLocations(fastestLocations)
                            ) : (
                                <Skeleton />
                            )}
                        </div>
                    </>
                )}

                {renderFilteredEndpoint()}
            </div>
        </div>
    );
});

export default Locations;
