import React from 'react';

import './title.pcss';

export interface TitleProps {
    title: React.ReactNode | string;

    // FIXME: Add support
    // eslint-disable-next-line react/no-unused-prop-types
    subtitle?: React.ReactNode | string,
    // eslint-disable-next-line react/no-unused-prop-types
    onClick?: () => void;
}

export function Title({ title }: TitleProps) {
    return (
        <div className="title">
            <div className="title__text">{title}</div>
        </div>
    );
}
