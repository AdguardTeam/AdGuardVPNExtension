import React, { type ReactElement, useContext, useState } from 'react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../../stores';
import { translator } from '../../../../../../common/translator';
import { Input } from '../../../../ui/Input';

import './manual-mode.pcss';

export const MANUAL_FORM_ID = 'add-exclusion-form-manual';

/**
 * ManualMode component props.
 */
interface ManualModeProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const ManualMode = ({ isProfileContext }: ManualModeProps): ReactElement => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const [inputValue, setInputValue] = useState('');

    const closeExclusionModal = (): void => {
        exclusionsStore.closeAddExclusionModal();
    };

    const addUrl = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        telemetryStore.sendCustomEvent(
            isProfileContext
                ? TelemetryActionName.ProfileAddWebsiteManually
                : TelemetryActionName.AddWebsiteManually,
            isProfileContext
                ? TelemetryScreenName.ProfileDialogAddWebsiteExclusion
                : TelemetryScreenName.DialogAddWebsiteExclusion,
        );

        if (exclusionsStore.validateUrl(inputValue)) {
            const addedExclusionsCount = await exclusionsStore.addUrlToExclusions(inputValue.trim());
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
