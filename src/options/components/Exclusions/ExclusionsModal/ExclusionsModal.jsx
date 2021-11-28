import React from 'react';
import Modal from 'react-modal';

export var ExclusionsModal = function ({
    isOpen, closeModal, title, description, children,
}) {
    return (
        <Modal
            isOpen={isOpen}
            className="modal modal-exclusions"
            overlayClassName="overlay overlay--fullscreen"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon checkbox__button modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            {
                title && <div className="modal__title">{title}</div>
            }
            {
                description && <div className="modal__description">{description}</div>
            }
            {children}
        </Modal>
    );
};
