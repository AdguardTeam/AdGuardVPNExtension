import React, { useContext, useState } from 'react';
import { rootStore } from '../../../../../stores';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import './manual-mode.pcss';

export const ManualMode = () => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeExclusionModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (
        e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.preventDefault();

        if (exclusionsStore.validateUrl(inputValue)) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(inputValue);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: exclusionsStore.restoreExclusions,
                },
            );
        } else {
            exclusionsStore.confirmUrlToAdd(inputValue);
        }

        closeExclusionModal();
    };

    return (
        <form
            className="manual-mode"
            onSubmit={addUrl}
        >
            <div className="input__label">
                {reactTranslator.getMessage('settings_exclusion_domain_name')}
            </div>
            <label className="input">
                <input
                    type="text"
                    className="input__in input__in--content input__in--clear"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                {inputValue.length > 0 && (
                    <button
                        type="button"
                        className="button input__clear"
                        onClick={() => { setInputValue(''); }}
                    >
                        <svg className="icon icon--button icon--cross">
                            <use xlinkHref="#cross" />
                        </svg>
                    </button>
                )}
            </label>
            <div className="manual-mode__actions">
                <button
                    type="button"
                    className="button button--medium button--outline-secondary"
                    onClick={closeExclusionModal}
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
