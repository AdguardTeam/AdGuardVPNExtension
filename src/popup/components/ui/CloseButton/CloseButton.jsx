import React from 'react';
import './close-button.pcss';

export const CloseButton = (prop) => {
    const { handler } = prop;

    const clickHandler = () => {
        handler();
    };

    return (
        <div className="close-button">
            <button
                type="button"
                onClick={clickHandler}
            />
        </div>
    );
};
