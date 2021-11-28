import React from 'react';

const Info = function ({ title, status, children }) {
    return (
        <div className="site-info">
            <div className="site-info__title">
                {title}
            </div>
            <div className="site-info__status">
                {status}
            </div>
            {children}
        </div>
    );
};

export default Info;
