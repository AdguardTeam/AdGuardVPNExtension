import React from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './checkbox.pcss';

export interface CheckboxProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    value: boolean;
    onChange: (value: boolean) => void;
}

export function Checkbox({
    title,
    description,
    value,
    onChange,
}: CheckboxProps) {
    const handleClick = () => {
        onChange(!value);
    };

    return (
        <button
            className={classNames('checkbox', value && 'checkbox--active')}
            onClick={handleClick}
            type="button"
        >
            <div className="checkbox__content">
                <div className="checkbox__box">
                    <Icon name={`checkbox-${value ? 'enabled' : 'disabled'}`} className="checkbox__box-icon" />
                </div>
                <div className="checkbox__title">{title}</div>
            </div>
            {description && (
                <div className="checkbox__description">
                    {description}
                </div>
            )}
        </button>
    );
}
