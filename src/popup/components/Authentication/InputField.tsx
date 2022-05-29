import React from 'react';
import classnames from 'classnames';

interface InputFieldParameters {
    id: string;
    type: string;
    value: string;
    inputChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    error: string | null;
    className: string | null;
    placeholder: string | undefined;
    label: string;
    disabled: boolean;
}

export const InputField = ({
    id,
    type,
    value,
    inputChangeHandler,
    error,
    className = '',
    placeholder = '',
    label = '',
    disabled = false,
}: InputFieldParameters) => {
    const inputClassName = classnames(
        `form__input ${className}`,
        { 'form__input--error': error },
    );

    return (
        <div className="form__item">
            <label>
                <div className="form__label">
                    {label}
                </div>
                <input
                    id={id}
                    name={id}
                    className={inputClassName}
                    type={type}
                    onChange={inputChangeHandler}
                    value={value}
                    placeholder={placeholder}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    disabled={disabled}
                />
            </label>
        </div>
    );
};
