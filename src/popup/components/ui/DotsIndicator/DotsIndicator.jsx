import React from 'react';
import classnames from 'classnames';

import './dots-indicator.pcss';

export const DotsIndicator = (props) => {
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
                    className={classnames(
                        'dots-indicator__dot',
                        { 'dots-indicator__dot--active': dot === activeDot },
                    )}
                    onClick={clickHandler(dot)}
                    type="button"
                    key={dot}
                />
            ))}
        </div>
    );
};
