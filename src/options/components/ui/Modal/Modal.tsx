import React, { useEffect, useRef, type PropsWithChildren } from 'react';

import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';
import { ReactPortal } from '../ReactPortal';
import { Icon } from '../Icon';

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
    onOpenChange: (open: boolean) => void;
}

export function Modal({
    title,
    description,
    open,
    children,
    onOpenChange,
}: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    const closeModal = () => {
        onOpenChange(false);
    };

    useOnClickOutside(ref, closeModal);

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
                    <button
                        type="button"
                        className="modal__close-btn"
                        onClick={closeModal}
                    >
                        <Icon name="cross" className="modal__close-btn-icon" />
                    </button>
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
