import React from 'react';

import classNames from 'classnames';

import { IconButton } from '../Icon';

import './input.pcss';

/**
 * Base props for the input component.
 */
export interface InputBaseProps {
    /**
     * ID of the element.
     */
    id?: string;

    /**
     * Name of the element.
     */
    name?: string;

    /**
     * Label of the element.
     */
    label?: React.ReactNode;

    /**
     * Placeholder of the element.
     */
    placeholder?: string;

    /**
     * Whether the element is required or not.
     */
    required?: boolean;

    /**
     * Current value of the element.
     */
    value: string;

    /**
     * Error message to display.
     */
    error?: React.ReactNode;

    /**
     * Change event handler.
     */
    onChange?: (value: string) => void;
}

/**
 * Input component props.
 */
export interface InputProps extends InputBaseProps {
    /**
     * Type of the input. Default is 'text'.
     */
    type?: 'text' | 'email';

    /**
     * Whether the input is read-only or not.
     */
    readOnly?: boolean;

    /**
     * Postfix message to display.
     */
    postfix?: string;
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
    const classes = classNames(
        'input',
        !!error && 'input--error',
    );

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
                />
                {value && !readOnly && (
                    <IconButton
                        name="cross"
                        onClick={clearValue}
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
