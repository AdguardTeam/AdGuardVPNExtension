import React, { useRef, type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';
import { useLockBody } from '../../../hooks/useLockBody';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { ReactPortal } from '../ReactPortal';
import { IconButton } from '../Icon';

import './modal.pcss';

export interface ModalProps extends PropsWithChildren {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    open: boolean;
    variant?: 'default' | 'thin';
    onClose: () => void;
}

export function Modal({
    title,
    description,
    open,
    variant = 'default',
    children,
    onClose,
}: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    const classes = classNames('modal', `modal--${variant}`);

    useOnClickOutside(ref, onClose);
    useFocusTrap(ref, open);
    useLockBody(open);

    if (!open) {
        return null;
    }

    return (
        <ReactPortal>
            <div className={classes}>
                <div className="modal__overlay" />
                <div ref={ref} className="modal__content">
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
                </div>
            </div>
        </ReactPortal>
    );
}
