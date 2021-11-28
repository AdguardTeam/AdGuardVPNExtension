import React from 'react';
import classnames from 'classnames';

import './dots-indicator.pcss';

export var DotsIndicator = function (props) {
    const {
        dotsAmount,
        activeDot,
        navigationHandler,
    } = props;

    const dots = [...Array(dotsAmount).keys()];

    const clickHandler = (dotId) => () => {
        navigationHandler(dotId);
    };

    return (
        <div className="dots-indicator">
            {dots.map((dot) => (
                <button
                    onClick={clickHandler(dot)}
                    type="button"
                    key={dot}
                >
                    <div className={classnames(
                        'dots-indicator__dot',
                        { 'dots-indicator__dot--active': dot === activeDot },
                    )}
                    />
                </button>
            ))}
        </div>
    );
};
