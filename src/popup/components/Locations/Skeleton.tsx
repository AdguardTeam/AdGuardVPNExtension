import React from 'react';

import './skeleton.pcss';

export const Skeleton = () => (
    <>
        <div className="skeleton">
            <div className="skeleton__icon" />
            <div className="skeleton__line" />
        </div>
        <div className="skeleton">
            <div className="skeleton__icon" />
            <div className="skeleton__line" />
        </div>
        <div className="skeleton">
            <div className="skeleton__icon" />
            <div className="skeleton__line" />
        </div>
    </>
);
