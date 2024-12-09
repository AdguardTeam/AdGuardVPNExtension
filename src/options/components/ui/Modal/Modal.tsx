import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { ReactPortal } from '../ReactPortal';
import { IconButton } from '../Icon';

import './modal.pcss';

export interface ModalProps extends PropsWithChildren {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    open: boolean;
    size?: 'large' | 'medium';
    onClose: () => void;
}

export function Modal({
    title,
    description,
    actions,
    open,
    size = 'large',
    children,
    onClose,
}: ModalProps) {
    const classes = classNames(
        'modal',
        `modal--size-${size}`,
    );

    if (!open) {
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
                    <div className="modal__title">
                        {title}
                    </div>
                    {description && (
                        <div className="modal__description">
                            {description}
                        </div>
                    )}
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
