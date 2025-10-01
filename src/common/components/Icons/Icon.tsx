import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import './icon.pcss';

/**
 * Icon color types.
 */
export type IconColor = 'current' | 'gray' | 'product' | 'error' | 'text-main';

/**
 * Icon size in pixels.
 */
export type IconSize = '16' | '20' | '24' | '30' | '48';

/**
 * Icon rotation types.
 * - `'none'` - no rotation
 * - `'clockwise'` - rotate 90 degrees to the left
 * - `'counter-clockwise'` - rotate 90 degrees to the right
 * - `'upside-down'` - rotate 180 degrees
 */
export type IconRotation = 'none' | 'clockwise' | 'counter-clockwise' | 'upside-down';

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
     * Color of the icon.
     * Default is `'current'`.
     */
    color?: IconColor;

    /**
     * Size of the icon in pixels.
     * Default is `'24'`.
     */
    size?: IconSize;

    /**
     * Rotation of the icon.
     * Default is `'none'`.
     */
    rotation?: IconRotation;

    /**
     * Additional class name.
     */
    className?: string;
}

export function Icon({
    name,
    color = 'current',
    size = '24',
    rotation = 'none',
    className,
}: IconProps): ReactElement {
    const classes = classNames(
        'icon',
        `icon--color-${color}`,
        `icon--size-${size}`,
        `icon--rotation-${rotation}`,
        className,
    );

    return (
        <svg className={classes}>
            <use xlinkHref={`#${name}`} />
        </svg>
    );
}
