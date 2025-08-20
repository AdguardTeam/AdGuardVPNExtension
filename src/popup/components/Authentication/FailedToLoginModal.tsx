import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { IconButton } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { SUPPORT_EMAIL } from '../../../background/constants';

/**
 * Failed to login modal component. Shown when the user fails to log in.
 */
export const FailedToLoginModal = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { isFailedToLoginModalOpen, closeFailedToLoginModal } = uiStore;

    return (
        <Modal
            isOpen={isFailedToLoginModalOpen}
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
                    {reactTranslator.getMessage('auth_failed_to_login_description', {
                        a: (chunks: any) => (
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="auth__modal-link"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
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
