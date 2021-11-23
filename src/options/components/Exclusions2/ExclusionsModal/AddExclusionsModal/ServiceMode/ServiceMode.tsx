import React, { useContext } from 'react';

import { Search } from '../../../Search';
import { ServicesList } from './ServicesList';
import { rootStore } from '../../../../../stores';

import './service-mode.pcss';

export const ServiceMode = () => {
    const { exclusionsStore } = useContext(rootStore);

    const handleAddServices = () => {
        // add selected services
    };

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    return (
        <div className="service-mode">
            <Search placeholder="Search" />
            <ServicesList />
            <div className="service-mode__actions">
                <button
                    type="button"
                    className="button button--medium button--outline-secondary"
                    onClick={closeModal}
                >
                    {/* FIXME add to translations */}
                    Cancel
                </button>
                <button
                    type="button"
                    className="button button--medium button--primary"
                    disabled
                    onClick={handleAddServices}
                >
                    {/* FIXME add to translations */}
                    Save
                </button>
            </div>
        </div>
    );
};
