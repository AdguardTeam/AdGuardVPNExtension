import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { reactTranslator } from '../../../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../../../common/forwarderHelpers';
import { rootStore } from '../../../stores';
import { Icon } from '../../ui/Icon';

export const PolicyAgreementModal = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;
    const { isAgreementModalOpen, closeAgreementModal } = uiStore;

    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    return (
        <Modal
            isOpen={isAgreementModalOpen}
            shouldCloseOnOverlayClick
            onRequestClose={closeAgreementModal}
            overlayClassName="modal__overlay"
            className="policy-agreement__modal"
        >
            <button
                type="button"
                className="button button--icon policy-agreement__modal-close"
                onClick={closeAgreementModal}
            >
                <Icon icon="cross" className="icon--button icon--cross-gray7f" />
            </button>
            <div className="policy-agreement__modal-content">
                <h2 className="policy-agreement__modal-title">
                    {translator.getMessage('settings_help_us_improve_modal_title')}
                </h2>
                <p className="policy-agreement__modal-text">
                    {reactTranslator.getMessage('popup_auth_help_us_improve_modal_desc_data', {
                        b: (chunks: any) => <b>{chunks}</b>,
                    })}
                </p>
                <p className="policy-agreement__modal-text">
                    {translator.getMessage('popup_auth_help_us_improve_modal_desc_info')}
                </p>
                <a
                    href={privacyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="policy-agreement__modal-link"
                >
                    {translator.getMessage('privacy_policy')}
                </a>
            </div>
            <div className="policy-agreement__modal-actions">
                <button
                    type="button"
                    onClick={closeAgreementModal}
                    className="button button--medium button--green form__btn policy-agreement__modal-button"
                >
                    {translator.getMessage('settings_help_us_improve_modal_button')}
                </button>
            </div>
        </Modal>
    );
});
