import React from 'react';

import classNames from 'classnames';

import { Controls } from '../../ui/Controls';
import { Icon } from '../../ui/Icon';

export interface FreeGbsButtonProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    doneDescription: string | React.ReactNode;
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
    const handleClick = () => {
        onClick(query);
    };

    return (
        <Controls
            title={title}
            description={completed ? doneDescription : description}
            className={classNames(
                'free-gbs__button',
                completed && 'free-gbs__button--completed',
            )}
            beforeAction={<Icon name="checkmark" className="free-gbs__button-check-icon" />}
            action={<Icon name="arrow-down" className="free-gbs__button-arrow-icon" />}
            onClick={handleClick}
        />
    );
}
