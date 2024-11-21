import React, { useRef } from 'react';

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

export function Controls({
    title,
    description,
    action,
    onClick,
    onOutsideClick,
}: ControlsProps) {
    const ref = useRef<HTMLDivElement>(null);

    const handleOutsideClick = () => {
        if (onOutsideClick) {
            onOutsideClick();
        }
    };

    useOnClickOutside(ref, handleOutsideClick);

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
}
