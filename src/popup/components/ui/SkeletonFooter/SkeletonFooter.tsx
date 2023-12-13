import React from 'react';

import './skeleton-footer.pcss';

export const SkeletonFooter = () => {
    return (
        <div className="skeleton-footer">
            <div className="skeleton-footer__empty skeleton-footer__empty-flag" />
            <div className="skeleton-footer__container">
                <div className="skeleton-footer__empty skeleton-footer__empty-title" />
                <div className="skeleton-footer__empty skeleton-footer__empty-desc" />
            </div>
        </div>
    );
};
