import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';
import { type AddExclusionMode } from '../../../stores/ExclusionsStore';
import { Button } from '../../ui/Button';

import { AddExclusionModal } from './AddExclusionModal';
import { ServiceMode } from './ServiceMode';
import { ManualMode } from './ManualMode';
import { AddExclusionConfirmModal } from './AddExclusionConfirmModal';

import './add-exclusion.pcss';

export const AddExclusion = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const {
        addExclusionModalOpen,
        addExclusionMode,
        confirmAddModalOpen,
        urlToConfirm,
        servicesSearchValue,
        isServicesSearchEmpty,
        filteredServicesData,
        servicesToToggle,
    } = exclusionsStore;

    const handleOpenModal = () => {
        exclusionsStore.openAddExclusionModal();
    };

    const handleCloseModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const handleModeChange = (mode: AddExclusionMode) => {
        exclusionsStore.setAddExclusionMode(mode);
    };

    const handleSearchChange = (value: string) => {
        exclusionsStore.setServicesSearchValue(value);
    };

    const handleServiceAdd = async () => {
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
                handler: () => exclusionsStore.restoreExclusions(),
            },
        );

        exclusionsStore.closeAddExclusionModal();
    };

    const handleCategoryClick = (categoryId: string) => {
        exclusionsStore.toggleCategoryVisibility(categoryId);
    };

    const handleServiceClick = (serviceId: string) => {
        exclusionsStore.addToServicesToToggle(serviceId);
    };

    const handleManualAdd = async (domain: string) => {
        if (exclusionsStore.validateUrl(domain)) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(domain);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: () => exclusionsStore.restoreExclusions(),
                },
            );
        } else {
            exclusionsStore.confirmUrlToAdd(domain);
        }

        exclusionsStore.closeAddExclusionModal();
    };

    const handleCloseConfirmModal = () => {
        exclusionsStore.setConfirmAddModalOpen(false);
    };

    const handleConfirm = async () => {
        if (urlToConfirm) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(urlToConfirm);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: () => exclusionsStore.restoreExclusions(),
                },
            );
        }
        handleCloseConfirmModal();
    };

    return (
        <>
            <Button variant="ghost" beforeIconName="plus" onClick={handleOpenModal}>
                {reactTranslator.getMessage('settings_exclusion_add_website')}
            </Button>
            <AddExclusionModal
                open={addExclusionModalOpen}
                mode={addExclusionMode}
                service={(
                    <ServiceMode
                        searchValue={servicesSearchValue}
                        searchEmpty={isServicesSearchEmpty}
                        categories={filteredServicesData}
                        selectedSize={servicesToToggle.length}
                        onSearchChange={handleSearchChange}
                        onClose={handleCloseModal}
                        onSubmit={handleServiceAdd}
                        onCategoryClick={handleCategoryClick}
                        onServiceClick={handleServiceClick}
                    />
                )}
                manual={(
                    <ManualMode
                        onClose={handleCloseModal}
                        onSubmit={handleManualAdd}
                    />
                )}
                onClose={handleCloseModal}
                onModeChange={handleModeChange}
            />
            <AddExclusionConfirmModal
                open={confirmAddModalOpen}
                url={urlToConfirm}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirm}
            />
        </>
    );
});
