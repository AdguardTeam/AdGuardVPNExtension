import React from 'react';

import { Controls } from '../../ui/Controls';
import { Icon } from '../../ui/Icon';

export interface SupportItemProps {
    title: React.ReactNode;
    description: React.ReactNode;
    icon: string;
    onClick: () => void;
}

export function SupportItem({
    title,
    description,
    icon,
    onClick,
}: SupportItemProps) {
    return (
        <Controls
            title={title}
            description={description}
            beforeAction={<Icon name={icon} className="support__icon" />}
            action={<Icon name="arrow-down" className="support__btn-icon" />}
            onClick={onClick}
        />
    );
}
