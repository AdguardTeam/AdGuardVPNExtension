import React from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './title.pcss';

export interface TitleProps {
    title: React.ReactNode | string;
    onClick?: () => void;
}

export function Title({ title, onClick }: TitleProps) {
    const isBackTitle = !!onClick;

    return (
        <div
            className={classNames('title', isBackTitle && 'title--hoverable')}
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
