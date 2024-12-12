import React from 'react';

import classNames from 'classnames';

import { Controls } from '../ui/Controls';
import { Icon, IconButton } from '../ui/Icon';

export interface FreeGbsButtonProps {
    title: React.ReactNode;
    description: React.ReactNode;
    doneDescription: React.ReactNode;
    isDone: boolean;
    query: string;
    onClick: (query: string) => void;
}

export function FreeGbsButton({
    title,
    description,
    doneDescription,
    isDone,
    query,
    onClick,
}: FreeGbsButtonProps) {
    const classes = classNames(
        'free-gbs__button',
        isDone && 'free-gbs__button--done',
    );

    const handleClick = () => {
        onClick(query);
    };

    return (
        <Controls
            title={title}
            description={isDone ? doneDescription : description}
            className={classes}
            beforeAction={<Icon name="checkmark" className="free-gbs__button-check-icon" />}
            action={<IconButton name="arrow-down" className="free-gbs__button-arrow-icon" />}
            onClick={handleClick}
        />
    );
}
