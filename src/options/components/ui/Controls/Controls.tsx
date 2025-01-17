import React, { forwardRef, useImperativeHandle, useRef } from 'react';

import classNames from 'classnames';

import { useOutsideClick } from '../../../../common/components/ui/useOutsideClick';
import { useOutsideFocus } from '../../../../common/components/ui/useOutsideFocus';

import './controls.pcss';

/**
 * Controls component props.
 */
export interface ControlsProps {
    /**
     * Title of the controls.
     */
    title: React.ReactNode;

    /**
     * Description of the controls.
     */
    description?: React.ReactNode;

    /**
     * Action of the controls that goes before the content (will be rendered on left side).
     */
    beforeAction?: React.ReactNode;

    /**
     * Action of the controls that goes after the content (will be rendered on right side).
     */
    action?: React.ReactNode;

    /**
     * Whether the controls are active or not.
     * If active, the controls will be highlighted with "pressed" background.
     */
    isActive?: boolean;

    /**
     * Additional class name.
     */
    className?: string;

    /**
     * Click event handler.
     * If provided, controls will be hoverable.
     */
    onClick?: () => void;

    /**
     * Outside click event handler.
     */
    onOutsideClick?: () => void;

    /**
     * Outside focus event handler.
     */
    onOutsideFocus?: () => void;
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
            onOutsideFocus,
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

        const handleOutsideFocus = () => {
            if (onOutsideFocus) {
                onOutsideFocus();
            }
        };

        useOutsideClick(ref, handleOutsideClick);
        useOutsideFocus(ref, handleOutsideFocus);
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
