import React from 'react';

import classNames from 'classnames';

import { IconButton } from '../Icon';

import './title.pcss';

export interface TitleProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    size?: 'medium' | 'large';
    style?: React.CSSProperties;
    smallGap?: boolean;
    onClick?: () => void;
}

export function Title({
    title,
    description,
    action,
    size = 'large',
    style,
    smallGap = false,
    onClick,
}: TitleProps) {
    const isBackTitle = !!onClick;

    const classes = classNames(
        'title',
        `title--${size}`,
        isBackTitle && 'title--hoverable',
        smallGap && 'title--small-gap',
    );

    return (
        <div
            className={classes}
            style={style}
            onClick={onClick}
        >
            <div className="title__text">
                <div className="title__text-start">
                    {isBackTitle && (
                        <IconButton
                            name="arrow-down"
                            className="title__text-start-icon"
                        />
                    )}
                    {title}
                </div>
                {action && (
                    <div className="title__action">
                        {action}
                    </div>
                )}
            </div>
            {description && (
                <div className="title__description">
                    {description}
                </div>
            )}
        </div>
    );
}
