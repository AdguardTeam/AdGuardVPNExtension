import React from 'react';
import cn from 'classnames';

interface TitleProps {
    title: React.ReactNode,
    subtitle?: string | React.ReactNode,
    onClick?: () => void;
}

export const Title = ({ title, subtitle, onClick }: TitleProps) => {
    const renderSubtitle = (subtitle?: string | React.ReactNode) => {
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
        <div>
            <h2
                className={cn(
                    'content__title',
                    { 'content__title--pointer': onClick },
                )}
                onClick={onClick}
            >
                {title}
            </h2>
            {renderSubtitle(subtitle)}
        </div>
    );
};
