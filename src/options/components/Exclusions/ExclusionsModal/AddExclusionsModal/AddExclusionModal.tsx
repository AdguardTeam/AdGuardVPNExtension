import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { TelemetryScreenName } from '../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../stores';
import { AddExclusionMode } from '../../../../stores/ExclusionsStore';
import { translator } from '../../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../../common/telemetry/useTelemetryPageViewEvent';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

import { SERVICE_FORM_ID, ServiceMode } from './ServiceMode';
import { MANUAL_FORM_ID, ManualMode } from './ManualMode';

import './add-exclusion-modal.pcss';

export const AddExclusionModal = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);
    const { addExclusionMode } = exclusionsStore;

    const isOpen = exclusionsStore.addExclusionModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogAddWebsiteExclusion,
        isOpen,
    );

    const onClose = (): void => {
        exclusionsStore.closeAddExclusionModal();
    };

    const onServiceModeClick = (): void => {
        exclusionsStore.setAddExclusionMode(AddExclusionMode.Service);
    };

    const onManualModeClick = (): void => {
        exclusionsStore.setAddExclusionMode(AddExclusionMode.Manual);
    };

    const ModeSelectButtons = {
        service: {
            classname: classnames(
                'add-exclusion-modal__tabs-item has-tab-focus',
                addExclusionMode === AddExclusionMode.Service && 'add-exclusion-modal__tabs-item--active',
            ),
        },
        manual: {
            classname: classnames(
                'add-exclusion-modal__tabs-item has-tab-focus',
                addExclusionMode === AddExclusionMode.Manual && 'add-exclusion-modal__tabs-item--active',
            ),
        },
    };

    const MODE_MAP = {
        [AddExclusionMode.Service]: {
            formId: SERVICE_FORM_ID,
            btnText: translator.getMessage('settings_exclusion_modal_save'),
            btnDisabled: !exclusionsStore.servicesToToggle.length,
            content: (): ReactElement => <ServiceMode />,
        },
        [AddExclusionMode.Manual]: {
            formId: MANUAL_FORM_ID,
            btnText: translator.getMessage('settings_exclusion_add_manually_add'),
            btnDisabled: false,
            content: (): ReactElement => <ManualMode />,
        },
    };

    const mode = MODE_MAP[addExclusionMode];

    return (
        <Modal
            isOpen={isOpen}
            title={translator.getMessage('settings_exclusion_add_website')}
            actions={(
                <>
                    <Button variant="outlined" onClick={onClose}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button form={mode.formId} type="submit" disabled={mode.btnDisabled}>
                        {mode.btnText}
                    </Button>
                </>
            )}
            className="exclusions__modal add-exclusion-modal"
            size="medium"
            onClose={onClose}
        >
            <div className="add-exclusion-modal__tabs">
                <button
                    onClick={onServiceModeClick}
                    type="button"
                    className={ModeSelectButtons.service.classname}
                >
                    <span className="add-exclusion-modal__tabs-item-text text-ellipsis">
                        {translator.getMessage('settings_exclusion_add_from_list')}
                    </span>
                </button>
                <button
                    onClick={onManualModeClick}
                    type="button"
                    className={ModeSelectButtons.manual.classname}
                >
                    <span className="add-exclusion-modal__tabs-item-text text-ellipsis">
                        {translator.getMessage('settings_exclusion_add_manually')}
                    </span>
                </button>
            </div>
            {mode.content()}
        </Modal>
    );
});
