import React, { useContext, useState } from 'react';

import { rootStore } from '../../../../../stores/index';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import './manual-mode.pcss';

export var ManualMode = function () {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (e: any) => {
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
                    className="button button--medium button--outline-secondary"
                    onClick={closeModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--medium button--primary"
                    onClick={addUrl}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_manually_add')}
                </button>
            </div>
        </form>
    );
};
