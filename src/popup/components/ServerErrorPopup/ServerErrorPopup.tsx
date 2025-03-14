import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';
import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';

import './server-error-popup.pcss';

type ServerErrorPopupData = {
    [key: string]: {
        title: React.ReactNode | string,
        info: React.ReactNode | string,
        button: {
            text: React.ReactNode | string,
            action: () => void,
        },
    }
};

/**
 * This component presents two screens: dialog screen and thank you screen
 */
export const ServerErrorPopup = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);
    const { showServerErrorPopup, closeServerErrorPopup } = settingsStore;

    enum ServerErrorPopupState {
        DialogScreen = 'dialogScreen',
        ThankYouScreen = 'thankYouScreen',
    }

    const initialPopupState = ServerErrorPopupState.DialogScreen;
    const [state, setState] = useState(initialPopupState);

    const isOpen = showServerErrorPopup;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogCantConnect,
        isOpen,
    );

    const closeModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CloseCantConnectClick,
            TelemetryScreenName.DialogCantConnect,
        );
        closeServerErrorPopup();
        // reset to initial server error popup state, otherwise it will be shown again if server error
        // occurs AG-23009
        setState(initialPopupState);
    };

    const serverErrorPopupData: ServerErrorPopupData = {
        [ServerErrorPopupState.DialogScreen]: {
            title: reactTranslator.getMessage('popup_server_error_popup_title'),
            info: reactTranslator.getMessage('popup_server_error_popup_info'),
            button: {
                text: reactTranslator.getMessage('popup_server_error_popup_action'),
                action: () => {
                    telemetryStore.sendCustomEvent(
                        TelemetryActionName.NudgeAdguardClick,
                        TelemetryScreenName.DialogCantConnect,
                    );
                    setState(ServerErrorPopupState.ThankYouScreen);
                },
            },
        },
        [ServerErrorPopupState.ThankYouScreen]: {
            title: reactTranslator.getMessage('popup_server_error_popup_thankyou_title'),
            info: reactTranslator.getMessage('popup_server_error_popup_thankyou_message'),
            button: {
                text: reactTranslator.getMessage('popup_server_error_popup_close'),
                action: () => {
                    closeModal();
                },
            },
        },
    };

    const modalClasses = classnames('modal', 'server-error-modal', {
        'server-error-modal--dialog': state === ServerErrorPopupState.DialogScreen,
        'server-error-modal--thankyou': state === ServerErrorPopupState.ThankYouScreen,
    });

    const imageClasses = classnames('server-error-modal__image', {
        'server-error-modal__image--dialog': state === ServerErrorPopupState.DialogScreen,
        'server-error-modal__image--thankyou': state === ServerErrorPopupState.ThankYouScreen,
    });

    return (
        <Modal
            isOpen={isOpen}
            className={modalClasses}
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <div className={imageClasses} />
            <div className="modal__title">
                {serverErrorPopupData[state].title}
            </div>
            <div className="server-error-modal__info">
                {serverErrorPopupData[state].info}
            </div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green server-error-modal__button"
                onClick={serverErrorPopupData[state].button.action}
            >
                {serverErrorPopupData[state].button.text}
            </button>
            {state === ServerErrorPopupState.DialogScreen
                && (
                    <button
                        type="button"
                        className="button button--medium button--medium--wide button--outline-secondary server-error-modal__button"
                        onClick={closeModal}
                    >
                        {reactTranslator.getMessage('popup_server_error_popup_cancel')}
                    </button>
                )}
        </Modal>
    );
});
