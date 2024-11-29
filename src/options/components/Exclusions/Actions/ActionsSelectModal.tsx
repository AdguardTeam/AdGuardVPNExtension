import React, { useEffect, useState } from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { Modal } from '../../ui/Modal';
import { Radio } from '../../ui/Radio';
import { Button } from '../../ui/Button';

const options = [
    {
        value: ExclusionsMode.Regular,
        title: translator.getMessage('options_exclusions_import_select_regular'),
    },
    {
        value: ExclusionsMode.Selective,
        title: translator.getMessage('options_exclusions_import_select_selective'),
    },
];

export interface ActionsSelectModalProps {
    mode: ExclusionsMode
    open: boolean;
    onClose: () => void;
    onRegularClick: () => void;
    onSelectiveClick: () => void;
}

export function ActionsSelectModal({
    mode,
    open,
    onClose,
    onRegularClick,
    onSelectiveClick,
}: ActionsSelectModalProps) {
    const [selectedList, setSelectedList] = useState(mode);

    useEffect(() => {
        setSelectedList(mode);
    }, [mode, open]);

    const handleImportClick = () => {
        if (selectedList === ExclusionsMode.Regular) {
            onRegularClick();
        } else {
            onSelectiveClick();
        }
    };

    return (
        <Modal
            title={reactTranslator.getMessage('options_exclusions_import_select_title')}
            description={reactTranslator.getMessage('options_exclusions_import_select_subtitle')}
            open={open}
            onClose={onClose}
        >
            <div className="mode-selector__content">
                {options.map(({ value, title }) => (
                    <Radio
                        key={value}
                        value={value}
                        active={selectedList === value}
                        title={title}
                        variant="thin"
                        onSelect={setSelectedList}
                    />
                ))}
            </div>
            <div className="form__actions">
                <Button size="large" onClick={handleImportClick}>
                    {translator.getMessage('settings_exclusion_import_button')}
                </Button>
                <Button variant="outline" size="large" onClick={onClose}>
                    {translator.getMessage('options_exclusions_delete_cancel_button')}
                </Button>
            </div>
        </Modal>
    );
}
