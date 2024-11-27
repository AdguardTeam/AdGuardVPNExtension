import React, { useState } from 'react';

import classNames from 'classnames';

import { IconButton } from '../Icon';

import './input.pcss';

export interface InputBaseProps {
    id?: string;
    name?: string;
    label?: React.ReactNode;
    placeholder?: string;
    required?: boolean;
    value: string;
    readOnly?: boolean;
    error?: React.ReactNode;
    postfix?: string;
    onChange?: (value: string) => void;
}

export interface InputProps extends InputBaseProps {
    type?: 'text' | 'email';
}

export function Input({
    id,
    name,
    type = 'text',
    label,
    placeholder,
    required,
    value,
    readOnly,
    error,
    postfix,
    onChange,
}: InputProps) {
    const [focused, setFocused] = useState(false);

    const classes = classNames(
        'input',
        !!error && 'input--error',
        focused && 'input--focus',
    );

    const handleFocus = () => {
        setFocused(true);
    };

    const handleBlur = () => {
        setFocused(false);
    };

    const clearValue = () => {
        if (onChange) {
            onChange('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <label htmlFor={id} className={classes}>
            {label && (
                <div className="input__label">
                    {label}
                </div>
            )}
            <div className="input__wrapper">
                <input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    className="input__native"
                    value={value}
                    onChange={handleChange}
                    required={required}
                    readOnly={readOnly}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {value && !readOnly && (
                    <IconButton
                        name="cross"
                        onClick={clearValue}
                        tabIndex={-1}
                        className="input__clear-btn"
                    />
                )}
                {postfix && (
                    <div className="input__postfix">
                        {postfix}
                    </div>
                )}
            </div>
            {!!error && (
                <div className="input__error">
                    {error}
                </div>
            )}
        </label>
    );
}
