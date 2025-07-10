import React from 'react';

import cn from 'classnames';

import { Icon } from '../../../../common/components/Icons/Icon';

import './checkbox.pcss';

type CheckboxProps = {
    id: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    label: string | React.ReactNode,
    labelSize?: string,
};

export const Checkbox = ({
    id,
    checked,
    onChange,
    label,
    labelSize,
}: CheckboxProps) => {
    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.currentTarget.checked);
    };

    const onButtonPressed = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter') {
            onChange(!checked);
        }
    };

    return (
        <label
            htmlFor={id}
            className="checkbox"
        >
            <button
                type="button"
                className="checkbox__button"
                onKeyDown={onButtonPressed}
            >
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    className="checkbox__input"
                    onChange={onChangeHandler}
                    tabIndex={-1}
                />
                <Icon
                    name={checked ? 'checkbox-enabled' : 'checkbox-disabled'}
                    color={checked ? 'product' : 'gray'}
                />
            </button>
            <div
                className={cn(
                    'checkbox__label',
                    { 'checkbox__label--small': labelSize === 'small' },
                )}
            >
                {label}
            </div>
        </label>
    );
};
