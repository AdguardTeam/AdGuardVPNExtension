import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import classNames from 'classnames';

import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';

import './controls.pcss';

export interface ControlsProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    beforeAction?: React.ReactNode;
    action?: React.ReactNode;
    active?: boolean;
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
            active,
            className,
            onClick,
            onOutsideClick,
        } = props;

        const ref = useRef<HTMLDivElement>(null);

        const classes = classNames(
            'controls',
            !!onClick && 'controls--hoverable',
            active && 'controls--active',
            className,
        );

        const handleOutsideClick = () => {
            if (onOutsideClick) {
                onOutsideClick();
            }
        };

        useOnClickOutside(ref, handleOutsideClick);
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
