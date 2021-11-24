import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './subdomain-modal.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const SubdomainModal = observer(({ groupId, parentServiceId }) => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const isOpen = exclusionsStore.addSubdomainModalOpen;

    const closeModal = () => {
        exclusionsStore.closeAddSubdomainModal();
    };

    const addSubdomain = async () => {
        if (inputValue) {
            if (parentServiceId) {
                await exclusionsStore
                    .addSubdomainToExclusionsGroupInService(parentServiceId, groupId, inputValue);
                closeModal();
                return;
            }
            await exclusionsStore.addSubdomainToExclusionsGroup(groupId, inputValue);
            closeModal();
        }
    };

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            title={reactTranslator.getMessage('settings_exclusion_subdomain_name')}
        >
            <form
                className="subdomain-modal"
                onSubmit={addSubdomain}
            >
                <label>
                    {reactTranslator.getMessage('settings_exclusion_add')}
                    <input
                        type="text"
                        className="subdomain-modal__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </label>
                <div className="subdomain-modal__actions">
                    <button
                        type="button"
                        className="button button--medium button--primary"
                        disabled={!inputValue}
                        onClick={addSubdomain}
                    >
                        {reactTranslator.getMessage('settings_exclusion_add')}
                    </button>
                </div>
            </form>
        </ExclusionsModal>
    );
});
