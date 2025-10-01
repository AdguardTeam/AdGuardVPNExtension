import React, {
    useState,
    useContext,
    useEffect,
    type ReactElement,
} from 'react';

import { translator } from '../../../../../common/translator';
import { ExclusionsMode } from '../../../../../common/exclusionsConstants';
import { rootStore } from '../../../../stores';
import { Radio } from '../../../ui/Radio';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

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
}: SelectListModalProps): ReactElement => {
    const { exclusionsStore } = useContext(rootStore);
    const { currentMode } = exclusionsStore;

    const [selectedList, setSelectedList] = useState(currentMode);

    useEffect(() => {
        setSelectedList(currentMode);
    }, [currentMode, isOpen]);

    const modesInfo = {
        [ExclusionsMode.Regular]: translator.getMessage('options_exclusions_import_select_regular'),
        [ExclusionsMode.Selective]: translator.getMessage('options_exclusions_import_select_selective'),
    };

    const handleImportClick = async (): Promise<void> => {
        if (selectedList === ExclusionsMode.Regular) {
            await handleRegularClick();
        } else {
            await handleSelectiveClick();
        }
    };

    const renderRadioButton = (exclusionsType: ExclusionsMode): ReactElement => (
        <Radio
            name="exclusion-type"
            value={exclusionsType}
            isActive={exclusionsType === selectedList}
            title={modesInfo[exclusionsType]}
            onSelect={setSelectedList}
        />
    );

    return (
        <Modal
            isOpen={isOpen}
            title={translator.getMessage('options_exclusions_import_select_title')}
            description={translator.getMessage('options_exclusions_import_select_subtitle')}
            actions={(
                <>
                    <Button onClick={handleImportClick}>
                        {translator.getMessage('settings_exclusion_import_button')}
                    </Button>
                    <Button variant="outlined" onClick={closeModal}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </>
            )}
            className="exclusions__modal--radio"
            onClose={closeModal}
        >
            {renderRadioButton(ExclusionsMode.Selective)}
            {renderRadioButton(ExclusionsMode.Regular)}
        </Modal>
    );
};
