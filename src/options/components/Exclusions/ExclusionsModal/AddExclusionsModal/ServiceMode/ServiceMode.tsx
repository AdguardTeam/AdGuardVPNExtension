import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServicesSearch } from '../../../Search/ServicesSearch';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import { ServicesList } from './ServicesList';

import './service-mode.pcss';

export const ServiceMode = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const handleSaveServices = async () => {
        const toggleServicesResult = await exclusionsStore.toggleServices();
        const { added, deleted } = toggleServicesResult;

        const addedExclusionsMessage = added
            ? reactTranslator.getMessage('options_exclusions_added_exclusions', { count: added })
            : '';

        const deletedExclusionsMessage = deleted
            ? reactTranslator.getMessage('options_exclusions_deleted_exclusions', { count: deleted })
            : '';

        notificationsStore.notifySuccess(
            `${addedExclusionsMessage} ${deletedExclusionsMessage}`,
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );

        closeModal();
    };

    return (
        <div className="service-mode">
            <ServicesSearch />
            <ServicesList />
            <div className="service-mode__actions">
                <button
                    type="button"
                    className="button button--large button--outline-secondary"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--large button--primary"
                    disabled={!exclusionsStore.servicesToToggle.length}
                    onClick={handleSaveServices}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_save')}
                </button>
            </div>
        </div>
    );
});
