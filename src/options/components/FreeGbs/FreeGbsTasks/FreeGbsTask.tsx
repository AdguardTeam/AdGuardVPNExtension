import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { translator } from '../../../../common/translator';
import { Title } from '../../ui/Title';
import { Button } from '../../ui/Button';

import './free-gbs-task.pcss';

export interface BaseProps {
    onBackClick: () => void;
}

export interface FreeGbsTaskProps extends PropsWithChildren, BaseProps {
    imageName: string;
    title: React.ReactNode;
    description: React.ReactNode;
    persistentDescription?: React.ReactNode;
    contentClassName?: string;
    completed?: boolean;
}

export function FreeGbsTask({
    imageName,
    title,
    description,
    persistentDescription,
    children,
    contentClassName,
    completed,
    onBackClick,
}: FreeGbsTaskProps) {
    const classes = classNames('free-gbs-task__content', contentClassName);

    return (
        <div className="free-gbs-task">
            <img
                src={`../../../assets/images/${imageName}`}
                alt={`Task - ${imageName}`}
                className="free-gbs-task__image"
            />
            <Title
                title={title}
                subtitle={description}
            />
            <div className={classes}>
                {!completed ? children : (
                    <Button
                        variant="outlined"
                        onClick={onBackClick}
                        className="free-gbs-task__go-back-btn"
                    >
                        {translator.getMessage('settings_free_gbs_go_back')}
                    </Button>
                )}
                {persistentDescription}
            </div>
        </div>
    );
}
