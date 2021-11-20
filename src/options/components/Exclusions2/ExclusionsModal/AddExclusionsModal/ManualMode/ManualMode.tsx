import React, { useContext, useState } from 'react';

import { rootStore } from '../../../../../stores/index';
import './manual-mode.pcss';

export const ManualMode = () => {
    const { exclusionsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (e) => {
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
                Domain name:
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
                    Cancel
                </button>
                <button
                    type="button"
                    className="button button--medium button--primary"
                    onClick={addUrl}
                >
                    Add manually
                </button>
            </div>
        </form>
    );
};
