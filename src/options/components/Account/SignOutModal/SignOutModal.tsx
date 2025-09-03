import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { translator } from '../../../../common/translator';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { rootStore } from '../../../stores';
import signOutImageUrl from '../../../../assets/images/sign-out.svg';

import './sign-out-modal.pcss';

/**
 * AG-42562
 * Accidentally clicking logout would be pretty annoying so we added confirmation popup
 */
export const SignOutModal = observer(() => {
    const { settingsStore, authStore, telemetryStore } = useContext(rootStore);

    const isOpen = settingsStore.isSignOutModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogLogOut,
        isOpen,
    );

    const closeModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CancelLogOutClick,
            TelemetryScreenName.DialogLogOut,
        );
        settingsStore.closeSignOutModal();
    };

    const signOut = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.LogOutClick,
            TelemetryScreenName.DialogLogOut,
        );
        await authStore.deauthenticate();
    };

    return (
        <Modal
            title=""
            isOpen={isOpen}
            className="sign-out-modal"
            size="large"
            onClose={closeModal}
        >
            <img
                src={signOutImageUrl}
                alt="Sign Out"
                className="sign-out-modal__sign-out-logo"
            />

            <div className="sign-out-modal__sign__out__info">
                <div className="sign-out-modal__sign-out-info-container">
                    <h1 className="sign-out-modal__sign-out-title">
                        {translator.getMessage('account_sign_out_question')}
                    </h1>
                    <div className="sign-out-modal__sign-out-text">
                        {translator.getMessage('account_sign_out_description')}
                    </div>
                </div>

                <div className="sign-out-modal__button-container">
                    <Button variant="filled" onClick={closeModal}>
                        {translator.getMessage('account_sign_out_popup_cancel')}
                    </Button>
                    <Button color="danger" variant="transparent" onClick={signOut}>
                        {translator.getMessage('account_sign_out')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
});
