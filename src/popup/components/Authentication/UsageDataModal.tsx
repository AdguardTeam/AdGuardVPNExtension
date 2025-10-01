import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../../common/forwarderHelpers';
import { IconButton } from '../../../common/components/Icons';
import { rootStore } from '../../stores';

/**
 * Usage data modal. Shown when consent checkbox link clicked.
 */
export const UsageDataModal = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;
    const { isUsageDataModalOpen, closeUsageDataModal } = uiStore;

    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    return (
        <Modal
            isOpen={isUsageDataModalOpen}
            shouldCloseOnOverlayClick
            onRequestClose={closeUsageDataModal}
            overlayClassName="modal__overlay"
            className="auth__modal"
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={closeUsageDataModal}
            />
            <div className="auth__modal-content">
                <h2 className="auth__modal-title">
                    {translator.getMessage('settings_help_us_improve_modal_title')}
                </h2>
                <p className="auth__modal-text">
                    {reactTranslator.getMessage('popup_auth_help_us_improve_modal_desc_data', {
                        b: (chunks: any) => <b>{chunks}</b>,
                    })}
                </p>
                <p className="auth__modal-text">
                    {translator.getMessage('popup_auth_help_us_improve_modal_desc_info')}
                </p>
                <a
                    href={privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth__modal-link"
                >
                    {translator.getMessage('privacy_policy')}
                </a>
            </div>
            <div className="auth__modal-actions">
                <button
                    type="button"
                    onClick={closeUsageDataModal}
                    className="button button--medium button--green auth__modal-button"
                >
                    {translator.getMessage('settings_help_us_improve_modal_button')}
                </button>
            </div>
        </Modal>
    );
});
