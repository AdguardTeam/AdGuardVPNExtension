import React from 'react';

import classNames from 'classnames';

import { IconButton } from '../../../../common/components/Icons';

/**
 * Props for the {@link StatsScreenModal} component.
 */
export interface StatsScreenModalProps {
    /**
     * Is modal open or not.
     */
    isOpen: boolean;

    /**
     * Title of the modal.
     */
    title: string

    /**
     * Description of the modal.
     */
    description: React.ReactNode;

    /**
     * Actions block of the modal.
     */
    actions: React.ReactNode;

    /**
     * Callback function to close the modal.
     */
    onClose: () => void;
}

/**
 * Component that renders a modal inside of the stats screen.
 */
export function StatsScreenModal(props: StatsScreenModalProps) {
    const {
        isOpen,
        title,
        description,
        actions,
        onClose,
    } = props;

    const classes = classNames(
        'stats-screen-modal',
        isOpen && 'stats-screen-modal--open',
    );

    return (
        <div className={classes}>
            <div className="stats-screen-modal__overlay" onClick={onClose} />
            <div className="stats-screen-modal__content">
                <IconButton
                    name="cross"
                    className="stats-screen-modal__close-btn"
                    onClick={onClose}
                />
                <div className="stats-screen-modal__text">
                    <div className="stats-screen-modal__title">
                        {title}
                    </div>
                    <div className="stats-screen-modal__description">
                        {description}
                    </div>
                </div>
                <div className="stats-screen-modal__actions">
                    {actions}
                </div>
            </div>
        </div>
    );
}
