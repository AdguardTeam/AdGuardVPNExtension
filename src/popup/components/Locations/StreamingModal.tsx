import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { IconButton } from '../../../common/components/Icons';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import streamingImgUrl from '../../../assets/images/streaming-services.svg';

import './streaming-modal.pcss';

/**
 * Modal component for displaying available streaming services at a location.
 */
export const StreamingModal = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { isStreamingModalOpen, streamingPlatforms } = uiStore;

    const handleClose = (): void => {
        uiStore.closeStreamingModal();
    };

    if (!isStreamingModalOpen || !streamingPlatforms || streamingPlatforms.length === 0) {
        return null;
    }

    const title = translator.getMessage('popup_streaming_modal_title');

    return (
        <Modal
            isOpen={isStreamingModalOpen}
            className="streaming-modal"
            shouldCloseOnOverlayClick
            overlayClassName="streaming-modal__overlay"
            onRequestClose={handleClose}
        >
            <div className="streaming-modal__content">
                <IconButton
                    name="cross"
                    className="streaming-modal__close"
                    onClick={handleClose}
                />

                <div className="streaming-modal__image-wrapper">
                    <img
                        src={streamingImgUrl}
                        alt={title}
                    />
                </div>

                <div className="streaming-modal__title">
                    {title}
                </div>

                <div className="streaming-modal__platforms">
                    {streamingPlatforms.map((platform) => {
                        const platformName = `• ${platform}`;
                        return (
                            <div key={platform} className="streaming-modal__platform-item">
                                {platformName}
                            </div>
                        );
                    })}
                </div>

                <div className="streaming-modal__footer">
                    <button
                        type="button"
                        className="button button--medium button--medium--wide button--green"
                        onClick={handleClose}
                    >
                        {translator.getMessage('popup_streaming_modal_button_ok')}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
