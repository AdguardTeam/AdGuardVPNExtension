import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import { Icon } from '../../../../common/components/Icons';
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

    /**
     * Whether subtitle should be indented to align with the back arrow.
     * Only applies when `onClick` is provided. Default is `true`.
     */
    subtitleIndent?: boolean;
}

export function Title({
    title,
    subtitle,
    action,
    size = 'large',
    className,
    onClick,
    subtitleIndent = true,
}: TitleProps): ReactElement {
    const isBackTitle = !!onClick;

    const classes = classNames(
        'title',
        `title--${size}`,
        isBackTitle && 'title--hoverable',
        isBackTitle && subtitleIndent && 'title--subtitle-indent',
        className,
    );

    return (
        <div className={classes}>
            <div className="title__text">
                {isBackTitle ? (
                    <button
                        type="button"
                        className="title__back-btn"
                        onClick={onClick}
                        aria-label={translator.getMessage('a11y_go_back')}
                    >
                        <Icon name="arrow-down" rotation="counter-clockwise" className="title__back-icon" />
                        {title}
                    </button>
                ) : (
                    <div className="title__text-start">
                        {title}
                    </div>
                )}
                {action && (
                    <div className="title__action">
                        {action}
                    </div>
                )}
            </div>
            {subtitle && (
                <div
                    className="title__subtitle"
                >
                    {subtitle}
                </div>
            )}
        </div>
    );
}
