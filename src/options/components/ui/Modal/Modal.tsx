import React, { useEffect, useRef, type PropsWithChildren } from 'react';

import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';
import { ReactPortal } from '../ReactPortal';
import { IconButton } from '../Icon';

import './modal.pcss';

const setBodyLockedState = (locked: boolean) => {
    if (locked) {
        document.body.classList.add('locked');
    } else {
        document.body.classList.remove('locked');
    }
};

export interface ModalProps extends PropsWithChildren {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    open: boolean;
    onClose: () => void;
}

export function Modal({
    title,
    description,
    open,
    children,
    onClose,
}: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useOnClickOutside(ref, onClose);

    useEffect(() => {
        setBodyLockedState(open);

        return () => {
            setBodyLockedState(false);
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <ReactPortal>
            <div className="modal">
                <div className="modal__overlay" />
                <div ref={ref} className="modal__content">
                    <IconButton
                        name="cross"
                        className="modal__close-btn"
                        onClick={onClose}
                    />
                    <div className="modal__title">{title}</div>
                    {description && (
                        <div className="modal__description">{description}</div>
                    )}
                    <div className="modal__wrapper">{children}</div>
                </div>
            </div>
        </ReactPortal>
    );
}
