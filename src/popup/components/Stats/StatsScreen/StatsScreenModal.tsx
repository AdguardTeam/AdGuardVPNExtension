import React from 'react';

import classNames from 'classnames';

import { Icon } from '../../ui/Icon';

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
     *
     * @returns
     */
    onClose: () => void;
}

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
                <button
                    type="button"
                    onClick={onClose}
                    className="stats-screen-modal__close-btn"
                >
                    <Icon
                        icon="cross"
                        className="stats-screen-modal__close-btn-icon"
                    />
                </button>
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
