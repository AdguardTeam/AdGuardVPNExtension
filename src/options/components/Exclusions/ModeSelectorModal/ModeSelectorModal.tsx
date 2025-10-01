import React, { type ReactElement, useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../stores';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { Modal } from '../../ui/Modal';
import { Radio } from '../../ui/Radio';
import { Button } from '../../ui/Button';

export const ModeSelectorModal = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    const isOpen = exclusionsStore.modeSelectorModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogExclusionsModeSelection,
        isOpen,
    );

    const [mode, setMode] = useState(exclusionsStore.currentMode);

    const closeModal = (): void => {
        exclusionsStore.setModeSelectorModalOpen(false);
        setMode(exclusionsStore.currentMode);
    };

    const handleSaveMode = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            mode === ExclusionsMode.Regular
                ? TelemetryActionName.GeneralModeClick
                : TelemetryActionName.SelectiveModeClick,
            TelemetryScreenName.DialogExclusionsModeSelection,
        );

        await exclusionsStore.setCurrentMode(mode);
        exclusionsStore.setModeSelectorModalOpen(false);
    };

    const titles = {
        [ExclusionsMode.Regular]: translator.getMessage('settings_exclusion_general_title'),
        [ExclusionsMode.Selective]: translator.getMessage('settings_exclusion_selective_title'),
    };

    const renderRadioButton = (exclusionsType: ExclusionsMode): ReactElement => (
        <Radio
            name="exclusion-mode"
            value={exclusionsType}
            isActive={exclusionsType === mode}
            title={titles[exclusionsType]}
            onSelect={setMode}
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            title={translator.getMessage('settings_exclusion_change_mode_modal_title')}
            actions={(
                <>
                    <Button onClick={handleSaveMode}>
                        {translator.getMessage('settings_dns_add_custom_server_save_and_select')}
                    </Button>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </>
            )}
            className="exclusions__modal--radio"
            onClose={closeModal}
        >
            {renderRadioButton(ExclusionsMode.Regular)}
            {renderRadioButton(ExclusionsMode.Selective)}
        </Modal>
    );
});
