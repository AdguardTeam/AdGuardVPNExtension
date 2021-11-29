import React from 'react';

import './popover.pcss';

export const Popover = ({ children }) => (
    <div className="popover-wrap">
        <div className="popover__trigger">
            <svg className="popover__icon">
                <use xlinkHref="#question" />
            </svg>
        </div>
        <div className="popover__body">
            {children}
        </div>
    </div>
);
