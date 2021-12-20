import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './subdomain-modal.pcss';

export const SubdomainModal = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const isOpen = exclusionsStore.addSubdomainModalOpen;

    const closeModal = () => {
        exclusionsStore.closeAddSubdomainModal();
        setInputValue('');
    };

    const addSubdomain = async (
        e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();
        // TODO do we need harder validation by regex?
        if (inputValue.includes(' ')) {
            notificationsStore.notifyError(reactTranslator.getMessage('settings_exclusion_invalid_subdomain'));
            return;
        }
        if (inputValue) {
            await exclusionsStore.addSubdomainToExclusions(inputValue);
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
                        {exclusionsStore.selectedExclusion?.value}
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
