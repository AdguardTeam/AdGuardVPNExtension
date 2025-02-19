import React, { useContext, useState } from 'react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../../background/telemetry';
import { rootStore } from '../../../../../stores';
import { translator } from '../../../../../../common/translator';
import { Input } from '../../../../ui/Input';

import './manual-mode.pcss';

export const MANUAL_FORM_ID = 'add-exclusion-form-manual';

export const ManualMode = () => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeExclusionModal = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddWebsiteManually,
            TelemetryScreenName.DialogAddWebsiteExclusion,
        );

        if (exclusionsStore.validateUrl(inputValue)) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(inputValue);
            notificationsStore.notifySuccess(
                translator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: translator.getMessage('settings_exclusions_undo'),
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
            id={MANUAL_FORM_ID}
            className="manual-mode"
            onSubmit={addUrl}
        >
            <Input
                id="domain"
                name="domain"
                label={translator.getMessage('settings_exclusion_domain_name')}
                placeholder="example.org"
                required
                value={inputValue}
                onChange={setInputValue}
            />
        </form>
    );
};
