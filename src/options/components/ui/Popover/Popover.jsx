import React from 'react';

import './popover.pcss';

export var Popover = function ({ children }) {
    return (
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
};
