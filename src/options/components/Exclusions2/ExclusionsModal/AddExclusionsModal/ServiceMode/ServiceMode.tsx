import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Search } from '../../../Search';
import { ServicesList } from './ServicesList';
import { rootStore } from '../../../../../stores';

import './service-mode.pcss';

export const ServiceMode = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const handleSaveServices = async () => {
        await exclusionsStore.saveServicesToToggle();
        closeModal();
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
                    disabled={!exclusionsStore.servicesToToggle.length}
                    onClick={handleSaveServices}
                >
                    {/* FIXME add to translations */}
                    Save
                </button>
            </div>
        </div>
    );
});
