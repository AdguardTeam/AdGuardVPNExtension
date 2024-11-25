import React from 'react';

import classNames from 'classnames';

import { IconButton } from '../Icon';

import './input.pcss';

export interface InputBaseProps {
    id?: string;
    name?: string;
    label: string | React.ReactNode;
    placeholder?: string;
    required?: boolean;
    value: string;
    readOnly?: boolean;
    error?: string | React.ReactNode | null;
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
    onChange,
}: InputProps) {
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
        <label
            htmlFor={id}
            className={classNames(
                'input',
                !!error && 'input--error',
                !!value && !readOnly && 'input--has-value',
            )}
        >
            <div className="input__label">
                {label}
            </div>
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
                />
                {value && !readOnly && (
                    <IconButton
                        name="cross"
                        onClick={clearValue}
                        tabIndex={-1}
                        className="input__clear-btn"
                    />
                )}
            </div>
            {!!error && (
                <div className="input__error">{error}</div>
            )}
        </label>
    );
}
