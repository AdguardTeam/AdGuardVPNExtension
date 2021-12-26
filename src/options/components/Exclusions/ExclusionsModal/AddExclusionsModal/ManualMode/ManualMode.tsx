import React, { useContext, useState } from 'react';

import { rootStore } from '../../../../../stores';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import './manual-mode.pcss';

export const ManualMode = () => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (
        e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();
        await exclusionsStore.addUrlToExclusions(inputValue);
        closeModal();
    };

    return (
        <form
            className="manual-mode"
            onSubmit={addUrl}
        >
            <label>
                {reactTranslator.getMessage('settings_exclusion_domain_name')}
                <input
                    type="text"
                    className="manual-mode__input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </label>
            <div className="manual-mode__actions">
                <button
                    type="button"
                    className="button button--large button--outline-gray"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--large button--primary"
                    onClick={addUrl}
                    disabled={!inputValue}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_manually_add')}
                </button>
            </div>
        </form>
    );
};
