import React from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './input.pcss';

export interface InputProps {
    id: string;
    name: string;
    type?: 'text';
    label: string | React.ReactNode;
    placeholder: string;
    required?: boolean;
    value: string;
    error?: string | React.ReactNode | null;
    onChange: (value: string) => void;
}

export function Input({
    id,
    name,
    type = 'text',
    label,
    placeholder,
    value,
    required,
    onChange,
    error,
}: InputProps) {
    const clearValue = () => {
        onChange('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        onChange(value);
    };

    return (
        <label
            htmlFor={id}
            className={classNames(
                'input',
                !!error && 'input--error',
                !!value && 'input--has-value',
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
                />
                {value && (
                    <button
                        className="input__clear-btn"
                        type="button"
                        tabIndex={-1}
                        onClick={clearValue}
                    >
                        <Icon name="cross" className="input__clear-btn-icon" />
                    </button>
                )}
            </div>
            {!!error && (
                <div className="input__error">{error}</div>
            )}
        </label>
    );
}
