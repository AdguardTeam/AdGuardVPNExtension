import React from 'react';

import classNames from 'classnames';

/**
 * Icon component props.
 */
export interface IconProps {
    /**
     * The name of the icon to display.
     *
     * Full list of available icons can be found in the `Icons.tsx` file.
     */
    name: string;

    /**
     * Additional class name.
     */
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
