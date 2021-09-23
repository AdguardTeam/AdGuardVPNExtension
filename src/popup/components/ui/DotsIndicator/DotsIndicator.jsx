import React from 'react';
import classnames from 'classnames';

import './dots-indicator.pcss';

export const DotsIndicator = (props) => {
    const {
        dotsAmount,
        activeDot,
    } = props;

    const dots = [...Array(dotsAmount).keys()];

    return (
        <div className="dots-indicator">
            {dots.map((dot) => (
                <div
                    className={classnames(
                        'dots-indicator__dot',
                        { 'dots-indicator__dot--active': dot === activeDot },
                    )}
                    key={dot}
                />
            ))}
        </div>
    );
};
