import React from 'react';

interface TitleProps {
    title: string | React.ReactNode,
    subtitle?: string | React.ReactNode,
}

export var Title = function ({ title, subtitle }: TitleProps) {
    const renderSubtitle = (
        <div className="content__subtitle">
            {subtitle}
        </div>
    );

    return (
        <>
            <h2 className="content__title">
                {title}
            </h2>
            {subtitle && renderSubtitle}
        </>
    );
};
