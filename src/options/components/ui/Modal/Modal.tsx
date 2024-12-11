import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { ReactPortal } from '../ReactPortal';
import { IconButton } from '../Icon';

import './modal.pcss';

/**
 * Modal component props.
 */
export interface ModalProps extends PropsWithChildren {
    /**
     * Title of the modal.
     */
    title: React.ReactNode;

    /**
     * Description of the modal.
     */
    description?: React.ReactNode;

    /**
     * Actions of the modal. Also can be considered as footer.
     */
    actions?: React.ReactNode;

    /**
     * Flag that indicates whether the modal is open or not.
     */
    isOpen: boolean;

    /**
     * Size of the modal. Default is `large`.
     * - 'large' - 720px width
     * - 'medium' - 600px width
     */
    size?: 'large' | 'medium';

    /**
     * Close event handler.
     */
    onClose: () => void;
}

export function Modal({
    title,
    description,
    actions,
    isOpen,
    size = 'large',
    children,
    onClose,
}: ModalProps) {
    const classes = classNames(
        'modal',
        `modal--size-${size}`,
    );

    if (!isOpen) {
        return null;
    }

    return (
        <ReactPortal>
            <div className={classes}>
                <div className="modal__overlay" onClick={onClose} />
                <div className="modal__content">
                    <IconButton
                        name="cross"
                        className="modal__close-btn"
                        onClick={onClose}
                    />
                    <div className="modal__header">
                        <div className="modal__title">
                            {title}
                        </div>
                        {description && (
                            <div className="modal__description">
                                {description}
                            </div>
                        )}
                    </div>
                    <div className="modal__wrapper">
                        {children}
                    </div>
                    {actions && (
                        <div className="modal__actions">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </ReactPortal>
    );
}
