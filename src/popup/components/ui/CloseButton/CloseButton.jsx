import React from 'react';

import Icon from '../Icon';

import './close-button.pcss';

export var CloseButton = function (props) {
    const { handler } = props;

    const clickHandler = () => {
        handler();
    };

    return (
        <div className="close-button">
            <button
                type="button"
                onClick={clickHandler}
            >
                <Icon icon="cross" className="close-button__icon" />
            </button>
        </div>
    );
};
