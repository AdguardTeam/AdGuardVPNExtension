import React, { useEffect, type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { ESC_KEY_NAME } from '../../../../common/components/ui/useOutsideClick';
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
     * Additional class name.
     */
    className?: string;

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
    className,
    children,
    onClose,
}: ModalProps) {
    const classes = classNames(
        'modal',
        `modal--size-${size}`,
        className,
    );

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.key === ESC_KEY_NAME) {
                onClose();
            }
        };

        document.addEventListener('keydown', listener);

        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [onClose]);

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
