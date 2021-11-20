import React, { useContext } from 'react';
import { Search } from '../../../Search';
import { ServicesList } from './ServicesList';

import './service-mode.pcss';
import { rootStore } from '../../../../../stores';

export const ServiceMode = () => {
    const { exclusionsStore } = useContext(rootStore);
    const handleAddServices = () => {
        // add founded service
    };

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
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
                    onClick={closeModal}
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
