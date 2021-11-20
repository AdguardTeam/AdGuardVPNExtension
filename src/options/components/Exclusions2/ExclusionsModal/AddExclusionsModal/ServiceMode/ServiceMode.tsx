import React from 'react';
import { Search } from '../../../Search';
import { ServicesList } from './ServicesList';

import './service-mode.pcss';

export const ServiceMode = () => {
    const handleAddServices = () => {

    };

    const handleCancelAddExclusions = () => {

    };

    return (
        <div className="service-mode">
            <Search placeholder="Search" />
            <ServicesList />
            {/* FIXME add to translations */}
            <div className="service-mode__actions">
                <button
                    type="button"
                    className="button button--medium button--outline-secondary"
                    onClick={handleCancelAddExclusions}
                >
                    Cancel
                </button>
                {/* FIXME add to translations */}
                <button
                    type="button"
                    className="button button--medium button--primary"
                    disabled
                    onClick={handleAddServices}
                >
                    Add
                </button>
            </div>
        </div>
    );
};
