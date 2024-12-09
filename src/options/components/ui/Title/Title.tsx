import React from 'react';

import classNames from 'classnames';

import { IconButton } from '../Icon';

import './title.pcss';

export interface TitleProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    size?: 'large' | 'medium';
    className?: string;
    onClick?: () => void;
}

export function Title({
    title,
    subtitle,
    size = 'large',
    className,
    onClick,
}: TitleProps) {
    const isBackTitle = !!onClick;

    const classes = classNames(
        'title',
        `title--${size}`,
        isBackTitle && 'title--hoverable',
        className,
    );

    return (
        <div className={classes} onClick={onClick}>
            <div className="title__text">
                <div className="title__text-start">
                    {isBackTitle && (
                        <IconButton
                            name="arrow-down"
                            className="title__text-start-icon has-tab-focus"
                        />
                    )}
                    {title}
                </div>
            </div>
            {subtitle && (
                <div className="title__subtitle">
                    {subtitle}
                </div>
            )}
        </div>
    );
}
