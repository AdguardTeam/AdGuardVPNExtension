import React from 'react';
import cn from 'classnames';

const Icon = function ({ icon, className }) {
    return (
        <svg className={cn('icon', className)}>
            <use xlinkHref={`#${icon}`} />
        </svg>
    );
};

export default Icon;
