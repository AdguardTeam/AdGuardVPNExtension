import React from 'react';
import classnames from 'classnames';

import './dots-indicator.pcss';

export const DotsIndicator = (props) => {
    const {
        dotsAmount,
        activeDot,
    } = props;

    const dots = [...Array(dotsAmount)];

    return (
        <div className="dots-indicator">
            {dots.map((el, i) => (
                // eslint-disable-next-line react/jsx-key
                <div
                    className={classnames(
                        'dots-indicator__dot',
                        { 'dots-indicator__dot--active': i === activeDot },
                    )}
                />
            ))}
        </div>
    );
};
