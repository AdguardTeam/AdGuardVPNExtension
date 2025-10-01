import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { useTelemetryPageViewEvent } from '../../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryScreenName } from '../../../../../background/telemetry/telemetryEnums';

export const SubdomainModal = observer(() => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const isOpen = exclusionsStore.addSubdomainModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogExclusionsAddSubdomain,
        isOpen,
    );

    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState<null | string>(null);

    const formId = 'add-subdomain-form';

    const closeModal = (): void => {
        exclusionsStore.closeAddSubdomainModal();
        setInputValue('');
    };

    const handleInputChange = (value: string): void => {
        setInputValue(value);
        setInputError(null);
    };

    const addSubdomain = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (inputValue.includes(' ')) {
            setInputError(translator.getMessage('settings_exclusion_invalid_subdomain'));
            return;
        }

        if (inputValue) {
            const addedExclusionsCount = await exclusionsStore.addSubdomainToExclusions(inputValue);
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
            closeModal();
            setInputValue('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title={translator.getMessage('settings_exclusion_add_subdomain')}
            actions={(
                <>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                    <Button form={formId} type="submit" disabled={!inputValue}>
                        {translator.getMessage('settings_exclusion_add')}
                    </Button>
                </>
            )}
            className="exclusions__modal"
            size="medium"
            onClose={closeModal}
        >
            <form id={formId} onSubmit={addSubdomain}>
                <Input
                    id="subdomain"
                    name="subdomain"
                    label={translator.getMessage('settings_exclusion_subdomain_name')}
                    placeholder="example"
                    required
                    value={inputValue}
                    error={inputError}
                    postfix={`.${exclusionsStore.selectedExclusion?.hostname}`}
                    onChange={handleInputChange}
                />
            </form>
        </Modal>
    );
});
