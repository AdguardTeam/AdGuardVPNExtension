import React from 'react';

interface TitleProps {
    title: string,
    subtitle?: string,
}

export const Title = ({ title, subtitle }: TitleProps) => {
    const renderSubtitle = (subtitle?: string) => {
        if (!subtitle) {
            return null;
        }

        return (
            <div className="content__subtitle">
                {subtitle}
            </div>
        );
    };

    return (
        <>
            <h2 className="content__title">
                {title}
            </h2>
            {renderSubtitle(subtitle)}
        </>
    );
};
