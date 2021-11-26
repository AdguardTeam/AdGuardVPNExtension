import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './subdomain-modal.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const SubdomainModal = observer(({ exclusionData, parentServiceId }) => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const isOpen = exclusionsStore.addSubdomainModalOpen;

    const closeModal = () => {
        exclusionsStore.closeAddSubdomainModal();
        setInputValue('');
    };

    const addSubdomain = async (e) => {
        e.preventDefault();
        if (inputValue) {
            if (parentServiceId) {
                await exclusionsStore.addSubdomainToExclusionsGroupInService(
                    parentServiceId,
                    exclusionData.id,
                    inputValue,
                );
                closeModal();
                setInputValue('');
                return;
            }
            await exclusionsStore.addSubdomainToExclusionsGroup(exclusionData.id, inputValue);
            closeModal();
            setInputValue('');
        }
    };

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            title={reactTranslator.getMessage('settings_exclusion_add_subdomain')}
        >
            <form
                className="subdomain-modal"
                onSubmit={addSubdomain}
            >
                <label>
                    {reactTranslator.getMessage('settings_exclusion_subdomain_name')}
                    <input
                        type="text"
                        className="subdomain-modal__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <div className="subdomain-modal__hostname">
                        {exclusionData.hostname}
                    </div>
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
