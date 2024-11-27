import React from 'react';

import classNames from 'classnames';

import { Controls } from '../../ui/Controls';
import { Icon } from '../../ui/Icon';

export interface FreeGbsButtonProps {
    title: React.ReactNode;
    description: React.ReactNode;
    doneDescription: React.ReactNode;
    completed: boolean;
    query: string;
    onClick: (query: string) => void;
}

export function FreeGbsButton({
    title,
    description,
    doneDescription,
    completed,
    query,
    onClick,
}: FreeGbsButtonProps) {
    const classes = classNames(
        'free-gbs__button',
        completed && 'free-gbs__button--completed',
    );

    const handleClick = () => {
        onClick(query);
    };

    return (
        <Controls
            title={title}
            description={completed ? doneDescription : description}
            className={classes}
            beforeAction={<Icon name="checkmark" className="free-gbs__button-check-icon" />}
            action={<Icon name="arrow-down" className="free-gbs__button-arrow-icon" />}
            onClick={handleClick}
        />
    );
}
