import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ServicesList } from './ServicesList';
import { rootStore } from '../../../../../stores';
import { ServicesSearch } from '../../../Search/ServicesSearch';
import { reactTranslator } from '../../../../../../common/reactTranslator';

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
            <ServicesSearch />
            <ServicesList />
            <div className="service-mode__actions">
                <button
                    type="button"
                    className="button button--medium button--outline-secondary"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--medium button--primary"
                    disabled={!exclusionsStore.servicesToToggle.length}
                    onClick={handleSaveServices}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_save')}
                </button>
            </div>
        </div>
    );
});
