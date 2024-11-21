import React from 'react';

import classNames from 'classnames';

export interface IconProps {
    name: string;
    className?: string;
}

export function Icon({ name, className }: IconProps) {
    return (
        <svg className={classNames('icon', className)}>
            <use xlinkHref={`#${name}`} />
        </svg>
    );
}
