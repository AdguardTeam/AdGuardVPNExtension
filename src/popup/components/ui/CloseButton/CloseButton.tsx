import React from 'react';

import { Icon } from '../Icon';

import './close-button.pcss';

type CloseButtonProps = {
    handler: () => void,
};

export const CloseButton = ({ handler }: CloseButtonProps) => {
    const clickHandler = (): void => {
        handler();
    };

    return (
        <div className="close-button">
            <button
                className="button button--close"
                type="button"
                onClick={clickHandler}
            >
                <Icon icon="cross" className="close-button__icon" />
            </button>
        </div>
    );
};
