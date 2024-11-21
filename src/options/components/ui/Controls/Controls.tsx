import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import classNames from 'classnames';

import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';

import './controls.pcss';

export interface ControlsProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    action?: React.ReactNode;
    onClick?: () => void;
    onOutsideClick?: () => void;
}

export const Controls = forwardRef<HTMLDivElement, ControlsProps>(
    (props, forwardedRef) => {
        const {
            title,
            description,
            action,
            onClick,
            onOutsideClick,
        } = props;

        const ref = useRef<HTMLDivElement>(null);

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
                className={classNames('controls', !!onClick && 'controls--hoverable')}
                onClick={onClick}
            >
                <div className="controls__content">
                    <div className="controls__title">{title}</div>
                    <div className="controls__description">{description}</div>
                </div>
                <div className="controls__action">{action}</div>
            </div>
        );
    },
);
