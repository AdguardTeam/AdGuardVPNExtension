import React from 'react';
import classnames from 'classnames';

import './dotsnavigator.pcss';

export const DotsNavigator = (props) => {
    const {
        num,
        active,
    } = props;

    const dots = [...Array(Number(num))];
    const activeDotNum = Number(active);

    return (
        <div className="dotsnavigator">
            {dots.map((el, i) => (
                // eslint-disable-next-line react/jsx-key
                <div
                    className={classnames(
                        'dotsnavigator__dot',
                        { 'dotsnavigator__dot--active': i === activeDotNum },
                    )}
                />
            ))}
        </div>
    );
};
