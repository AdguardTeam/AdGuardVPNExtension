import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import { IconButton } from '../../../../common/components/Icons';
import { translator } from '../../../../common/translator';

import './title.pcss';

/**
 * Title component props.
 */
export interface TitleProps {
    /**
     * Title text to display.
     */
    title: React.ReactNode;

    /**
     * Subtitle text to display.
     */
    subtitle?: React.ReactNode;

    /**
     * Action to display on the right side of the title.
     */
    action?: React.ReactNode;

    /**
     * Size of the title. Default is `large`.
     * - 'large' - 24px font size
     * - 'medium' - 20px font size
     */
    size?: 'large' | 'medium';

    /**
     * Additional class name.
     */
    className?: string;

    /**
     * Click event handler.
     * If provided, title will be hoverable.
     */
    onClick?: () => void;
}

export function Title({
    title,
    subtitle,
    action,
    size = 'large',
    className,
    onClick,
}: TitleProps): ReactElement {
    const isBackTitle = !!onClick;

    const classes = classNames(
        'title',
        `title--${size}`,
        isBackTitle && 'title--hoverable',
        className,
    );

    return (
        <div
            className={classes}
            onClick={onClick}
            aria-label={isBackTitle ? translator.getMessage('a11y_go_back') : undefined}
        >
            <div className="title__text">
                <div className="title__text-start">
                    {isBackTitle && <IconButton name="arrow-down" rotation="counter-clockwise" />}
                    {title}
                </div>
                {action && (
                    <div
                        className="title__action"
                        onClick={onClick && ((e): void => e.stopPropagation())}
                    >
                        {action}
                    </div>
                )}
            </div>
            {subtitle && (
                <div
                    className="title__subtitle"
                    onClick={onClick && ((e): void => e.stopPropagation())}
                >
                    {subtitle}
                </div>
            )}
        </div>
    );
}
