import React, { type ReactNode } from 'react';

type InfoProps = {
    title: string,
    status: string | ReactNode,
    children?: ReactNode,
};

export const Info = ({ title, status, children }: InfoProps) => (
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
