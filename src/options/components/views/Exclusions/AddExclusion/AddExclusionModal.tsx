import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { AddExclusionMode } from '../../../../stores/ExclusionsStore';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

interface TabButtonProps extends PropsWithChildren {
    activeMode: AddExclusionMode;
    mode: AddExclusionMode;
    onClick: (mode: AddExclusionMode) => void;
}

function TabButton({
    activeMode,
    mode,
    children,
    onClick,
}: TabButtonProps) {
    const handleClick = () => {
        onClick(mode);
    };

    return (
        <button
            type="button"
            className={classNames(
                'add-exclusion__tabs-item',
                mode === activeMode && 'add-exclusion__tabs-item--active',
            )}
            onClick={handleClick}
        >
            {children}
        </button>
    );
}

export interface AddExclusionModalProps {
    open: boolean;
    mode: AddExclusionMode;
    service: React.ReactNode;
    manual: React.ReactNode;
    onClose: () => void;
    onModeChange: (mode: AddExclusionMode) => void;
    onSaveClick: () => void;
}

export function AddExclusionModal({
    open,
    service,
    manual,
    mode,
    onClose,
    onModeChange,
    onSaveClick,
}: AddExclusionModalProps) {
    const actionText = mode === AddExclusionMode.Manual
        ? reactTranslator.getMessage('settings_exclusion_add_manually_add')
        : reactTranslator.getMessage('settings_exclusion_modal_save');

    return (
        <Modal
            title={reactTranslator.getMessage('settings_exclusion_add_website')}
            open={open}
            onClose={onClose}
        >
            <div className="add-exclusion__tabs">
                <TabButton
                    activeMode={mode}
                    mode={AddExclusionMode.Service}
                    onClick={onModeChange}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_from_list')}
                </TabButton>
                <TabButton
                    activeMode={mode}
                    mode={AddExclusionMode.Manual}
                    onClick={onModeChange}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_manually')}
                </TabButton>
            </div>
            <div className="add-exclusion__content">
                {mode === AddExclusionMode.Service ? service : manual}
            </div>
            <div className="exclusions__modal-actions">
                <Button variant="outline" onClick={onClose}>
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button onClick={onSaveClick}>
                    {actionText}
                </Button>
            </div>
        </Modal>
    );
}
