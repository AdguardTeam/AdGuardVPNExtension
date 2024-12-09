import React from 'react';

import classNames from 'classnames';

export interface IconProps {
    name: string;
    className?: string;
}

export function Icon({ name, className }: IconProps) {
    const classes = classNames(
        'icon',
        className,
    );

    return (
        <svg className={classes}>
            <use xlinkHref={`#${name}`} />
        </svg>
    );
}
