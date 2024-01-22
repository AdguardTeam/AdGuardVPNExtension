import React from 'react';

import classnames from 'classnames';

import './dots-indicator.pcss';

type DotsIndicatorProps = {
    dotsAmount?: number,
    activeDot: number,
    navigationHandler: (dotId: number) => void,
};

export const DotsIndicator = (props: DotsIndicatorProps) => {
    const {
        dotsAmount,
        activeDot,
        navigationHandler,
    } = props;

    const dots = [...Array(dotsAmount).keys()];

    const clickHandler = (dotId: number) => () => {
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
