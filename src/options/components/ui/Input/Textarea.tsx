import React from 'react';

import classNames from 'classnames';

import { type InputBaseProps } from './Input';

export function TextArea({
    id,
    name,
    label,
    placeholder,
    value,
    required,
    onChange,
    error,
}: InputBaseProps) {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        onChange(value);
    };

    return (
        <label
            htmlFor={id}
            className={classNames('input', !!error && 'input--error')}
        >
            <div className="input__label">
                {label}
            </div>
            <div className="input__wrapper">
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <textarea
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    className="input__native"
                    value={value}
                    onChange={handleChange}
                    required={required}
                />
            </div>
            {!!error && (
                <div className="input__error">{error}</div>
            )}
        </label>
    );
}
