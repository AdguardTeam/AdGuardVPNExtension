import React from 'react';

export interface IconProps {
    name: string;
    className?: string;
}

export function Icon({ name, className }: IconProps) {
    return (
        <svg className={className}>
            <use xlinkHref={`#${name}`} />
        </svg>
    );
}
