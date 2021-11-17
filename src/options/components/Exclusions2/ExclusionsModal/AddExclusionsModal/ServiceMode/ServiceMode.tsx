import React from 'react';
import { Search } from '../../../Search';
import { ServicesList } from './ServicesList';

export const ServiceMode = () => {
    const handleAddServices = () => {

    };

    const handleCancelAddExclusions = () => {

    };

    return (
        <>
            <Search />
            <ServicesList />
            {/* FIXME add to translations */}
            <button
                type="button"
                onClick={handleCancelAddExclusions}
            >
                Cancel
            </button>
            {/* FIXME add to translations */}
            <button
                type="button"
                onClick={handleAddServices}
            >
                Add
            </button>
        </>
    );
};
