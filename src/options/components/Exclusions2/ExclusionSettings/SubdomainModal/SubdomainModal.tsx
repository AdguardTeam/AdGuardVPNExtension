import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { rootStore } from '../../../../stores';

import './subdomain-modal.pcss';

export const SubdomainModal = observer(({ groupId }) => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const isOpen = exclusionsStore.addSubdomainModalOpen;

    const closeModal = () => {
        exclusionsStore.closeAddSubdomainModal();
    };

    const addSubdomain = async () => {
        if (inputValue) {
            await exclusionsStore.addSubdomainToExclusionsGroup(groupId, inputValue);
            closeModal();
        }
    };

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
            // FIXME add to translations
            title="Add a subdomain"
        >
            <form
                className="subdomain-modal"
                onSubmit={addSubdomain}
            >
                <label>
                    Subdomain name:
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
                        Add
                    </button>
                </div>
            </form>
        </ExclusionsModal>
    );
});
