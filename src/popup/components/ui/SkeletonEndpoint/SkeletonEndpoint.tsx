import React from 'react';

import './skeleton-endpoint.pcss';

export const SkeletonEndpoint = () => {
    return (
        <div className="endpoint skeleton-endpoint endpoint__skeleton">
            <div className="skeleton-endpoint__empty skeleton-endpoint__empty-flag" />
            <div className="skeleton-endpoint__container">
                <div className="skeleton-endpoint__empty skeleton-endpoint__empty-title" />
                <div className="skeleton-endpoint__empty skeleton-endpoint__empty-desc" />
            </div>
        </div>
    );
};
