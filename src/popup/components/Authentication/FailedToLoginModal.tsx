import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { IconButton } from '../../../common/components/Icons';
import { getForwarderUrl } from '../../../common/helpers';
import { rootStore } from '../../stores';
import { WebAuthState } from '../../../background/auth/webAuthEnums';
import { FORWARDER_URL_QUERIES } from '../../../background/config';

/**
 * Failed to login modal component. Shown when the user fails to log in.
 */
export const FailedToLoginModal = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const { webAuthFlowState, closeFailedToLoginModal } = authStore;
    const isWebAuthFlowFailedByUser = webAuthFlowState === WebAuthState.FailedByUser;
    const isWebAuthFlowHasError = webAuthFlowState === WebAuthState.Failed || isWebAuthFlowFailedByUser;

    const { forwarderDomain } = settingsStore;
    const supportUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_DEFAULT_SUPPORT);

    const description = !isWebAuthFlowFailedByUser
        ? reactTranslator.getMessage('auth_failed_to_login_description', {
            a: (chunks: any) => (
                <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth__modal-link"
                >
                    {chunks}
                </a>
            ),
        })
        : translator.getMessage('auth_failed_to_login_description_without_support');

    return (
        <Modal
            isOpen={isWebAuthFlowHasError}
            shouldCloseOnOverlayClick
            onRequestClose={closeFailedToLoginModal}
            overlayClassName="modal__overlay"
            className="auth__modal auth__modal--error"
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={closeFailedToLoginModal}
            />
            <div className="auth__modal-content">
                <h2 className="auth__modal-title">
                    {translator.getMessage('auth_failed_to_login_title')}
                </h2>
                <p className="auth__modal-text">
                    {description}
                </p>
            </div>
            <div className="auth__modal-actions">
                <button
                    type="button"
                    onClick={closeFailedToLoginModal}
                    className="button button--medium button--green auth__modal-button"
                >
                    {translator.getMessage('auth_failed_to_login_button')}
                </button>
            </div>
        </Modal>
    );
});
