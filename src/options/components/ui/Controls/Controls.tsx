import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import classNames from 'classnames';

import { useOutsideClick } from '../../../../common/components/ui/useOutsideClick';

import './controls.pcss';

export interface ControlsProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    beforeAction?: React.ReactNode;
    action?: React.ReactNode;
    isActive?: boolean;
    className?: string;
    onClick?: () => void;
    onOutsideClick?: () => void;
}

export const Controls = forwardRef<HTMLDivElement, ControlsProps>(
    (props, forwardedRef) => {
        const {
            title,
            description,
            beforeAction,
            action,
            isActive,
            className,
            onClick,
            onOutsideClick,
        } = props;

        const ref = useRef<HTMLDivElement>(null);

        const classes = classNames(
            'controls',
            !!onClick && 'controls--hoverable',
            isActive && 'controls--active',
            className,
        );

        const handleOutsideClick = () => {
            if (onOutsideClick) {
                onOutsideClick();
            }
        };

        useOutsideClick(ref, handleOutsideClick);
        useImperativeHandle(forwardedRef, () => ref.current!);

        return (
            <div
                ref={ref}
                className={classes}
                onClick={onClick}
            >
                {beforeAction && (
                    <div className="controls__before-action">
                        {beforeAction}
                    </div>
                )}
                <div className="controls__content">
                    <div className="controls__title">{title}</div>
                    {description && (
                        <div className="controls__description">
                            {description}
                        </div>
                    )}
                </div>
                {action && (
                    <div className="controls__action">
                        {action}
                    </div>
                )}
            </div>
        );
    },
);
