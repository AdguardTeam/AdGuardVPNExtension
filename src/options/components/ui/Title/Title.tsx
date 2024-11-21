import React from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './title.pcss';

export interface TitleProps {
    title: React.ReactNode | string;
    size?: 'medium' | 'large';
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function Title({
    title,
    size = 'large',
    style,
    onClick,
}: TitleProps) {
    const isBackTitle = !!onClick;

    return (
        <div
            className={classNames(
                'title',
                `title--${size}`,
                isBackTitle && 'title--hoverable',
            )}
            style={style}
            onClick={onClick}
        >
            <div className="title__text">
                <div className="title__text-start">
                    {isBackTitle && <Icon name="arrow-down" className="title__text-start-icon" />}
                    {title}
                </div>
            </div>
        </div>
    );
}
