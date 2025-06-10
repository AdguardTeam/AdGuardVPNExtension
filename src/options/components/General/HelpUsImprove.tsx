import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../../common/forwarderHelpers';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const HelpUsImprove = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        helpUsImprove,
        setHelpUsImproveValue,
        isHelpUsImproveModalOpen,
        openHelpUsImproveModal,
        closeHelpUsImproveModal,
        forwarderDomain,
    } = settingsStore;

    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const handleToggle = async (): Promise<void> => {
        await setHelpUsImproveValue(!helpUsImprove);
    };

    const onUsageDataClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        // Prevent the parent element from toggling the switch
        e.stopPropagation();
        openHelpUsImproveModal();
    };

    return (
        <>
            <ControlsSwitch
                title={translator.getMessage('settings_help_us_improve_title')}
                description={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                    link: (chunks: any) => (
                        <a
                            role="button"
                            href="#"
                            className="link"
                            onClick={onUsageDataClick}
                        >
                            {chunks}
                        </a>
                    ),
                })}
                isActive={helpUsImprove}
                onToggle={handleToggle}
            />
            <Modal
                title={translator.getMessage('settings_help_us_improve_modal_title')}
                description={(
                    <>
                        <p className="help-us-modal__text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_data')}
                        </p>
                        <ul className="help-us-modal__list">
                            <li className="help-us-modal__list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_screens')}
                            </li>
                            <li className="help-us-modal__list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_buttons')}
                            </li>
                            <li className="help-us-modal__list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_sessions')}
                            </li>
                        </ul>
                        <p className="help-us-modal__text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_improve')}
                        </p>
                        <p className="help-us-modal__text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_internally')}
                        </p>
                        <a
                            href={privacyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link help-us-modal__link"
                        >
                            {translator.getMessage('privacy_policy')}
                        </a>
                    </>
                )}
                isOpen={isHelpUsImproveModalOpen}
                actions={(
                    <Button onClick={closeHelpUsImproveModal}>
                        {translator.getMessage('settings_help_us_improve_modal_button')}
                    </Button>
                )}
                className="help-us-modal"
                onClose={closeHelpUsImproveModal}
            />
        </>
    );
});
