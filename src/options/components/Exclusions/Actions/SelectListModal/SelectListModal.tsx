import React, { useState, useContext, useEffect } from 'react';
import classnames from 'classnames';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { ExclusionsModal } from '../../ExclusionsModal/ExclusionsModal';
import { Title } from '../../../ui/Title';
import { ExclusionsMode } from '../../../../../common/exclusionsConstants';
import { rootStore } from '../../../../stores';

interface SelectListModalProps {
    isOpen: boolean;
    closeModal: () => void;
    handleRegularClick: () => Promise<void>;
    handleSelectiveClick: () => Promise<void>;
}

export const SelectListModal = ({
    isOpen,
    closeModal,
    handleRegularClick,
    handleSelectiveClick,
}: SelectListModalProps) => {
    const { exclusionsStore } = useContext(rootStore);
    const { currentMode } = exclusionsStore;

    const [selectedList, setSelectedList] = useState(currentMode);

    useEffect(() => {
        setSelectedList(currentMode);
    }, [currentMode, isOpen]);

    const modesInfo = {
        [ExclusionsMode.Regular]: reactTranslator.getMessage('options_exclusions_import_select_regular'),
        [ExclusionsMode.Selective]: reactTranslator.getMessage('options_exclusions_import_select_selective'),
    };

    const handleImportClick = async () => {
        if (selectedList === ExclusionsMode.Regular) {
            await handleRegularClick();
        } else {
            await handleSelectiveClick();
        }
    };

    const renderRadioButton = (exclusionsType: ExclusionsMode) => {
        const enabled = exclusionsType === selectedList;
        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });
        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });

        return (
            <div
                className="radio"
                onClick={() => setSelectedList(exclusionsType)}
            >
                <svg className="radio__icon">
                    <use xlinkHref={xlinkHref} />
                </svg>
                <div className="radio__label">
                    <div className={titleClass}>
                        {modesInfo[exclusionsType]}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={closeModal}
        >
            <Title
                title={reactTranslator.getMessage('options_exclusions_import_select_title')}
                subtitle={reactTranslator.getMessage('options_exclusions_import_select_subtitle')}
            />
            {renderRadioButton(ExclusionsMode.Selective)}
            {renderRadioButton(ExclusionsMode.Regular)}
            <div>
                <button
                    type="button"
                    onClick={closeModal}
                    className="button button--outline-secondary button--large modal__button--first"
                >
                    {reactTranslator.getMessage('options_exclusions_delete_cancel_button')}
                </button>
                <button
                    type="button"
                    onClick={handleImportClick}
                    className="button button--primary button--large"
                >
                    {reactTranslator.getMessage('settings_exclusion_import_button')}
                </button>
            </div>
        </ExclusionsModal>
    );
};
