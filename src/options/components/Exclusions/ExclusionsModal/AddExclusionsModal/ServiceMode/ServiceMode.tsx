import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServicesSearch } from '../../../Search';
import { translator } from '../../../../../../common/translator';

import { ServicesList } from './ServicesList';

import './service-mode.pcss';

export const SERVICE_FORM_ID = 'add-exclusion-form-service';

export const ServiceMode = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const handleSaveServices = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const toggleServicesResult = await exclusionsStore.toggleServices();
        const { added, deleted } = toggleServicesResult;

        const addedExclusionsMessage = added
            ? translator.getMessage('options_exclusions_added_exclusions', { count: added })
            : '';

        const deletedExclusionsMessage = deleted
            ? translator.getMessage('options_exclusions_deleted_exclusions', { count: deleted })
            : '';

        notificationsStore.notifySuccess(
            `${addedExclusionsMessage} ${deletedExclusionsMessage}`,
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );

        closeModal();
    };

    return (
        <form
            id={SERVICE_FORM_ID}
            className="service-mode"
            onSubmit={handleSaveServices}
        >
            <ServicesSearch />
            <ServicesList />
        </form>
    );
});
