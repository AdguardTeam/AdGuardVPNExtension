import React from 'react';

export const SkeletonEndPoint = () => {
    return (
        <div className="skeleton__endpoint">
            <div className="skeleton__endpoint--empty skeleton__endpoint--empty-flag" />
            <div className="skeleton__endpoint--container">
                <div className="skeleton__endpoint--empty skeleton__endpoint--empty-title" />
                <div className="skeleton__endpoint--empty skeleton__endpoint--empty-desc" />
            </div>
        </div>
    );
};
