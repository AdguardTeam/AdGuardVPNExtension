import React from 'react';
import './closebutton.pcss';

export const CloseButton = (prop) => {
    const { handler } = prop;
    const clickHandler = () => {
        handler();
    };

    return (
        <div className="closebutton">
            <button
                type="button"
                onClick={clickHandler}
            />
        </div>
    );
};
