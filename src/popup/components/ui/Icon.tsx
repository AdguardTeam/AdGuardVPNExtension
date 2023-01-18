import React from 'react';
import cn from 'classnames';

type IconProps = {
    icon: string,
    className: string,
};

export const Icon = ({ icon, className }: IconProps) => {
    return (
        <svg className={cn('icon', className)}>
            <use xlinkHref={`#${icon}`} />
        </svg>
    );
};
