import React, { useState } from 'react';

import classnames from 'classnames';

import { IconButton } from '../../../common/components/Icons';
import { type CredentialsKey } from '../../stores/AuthStore';

interface PasswordFieldParameters {
    id: CredentialsKey;
    password: string;
    onChange?: (id: CredentialsKey, value: string) => void;
    error?: string | null;
    placeholder: string;
    label: string | undefined;
    focus?: boolean;
}

const PasswordField = ({
    id,
    password,
    onChange,
    error,
    placeholder = '',
    label = '',
    focus = false,
}: PasswordFieldParameters) => {
    const [isPasswordShown, setIsPasswordShown] = useState(false);

    const inputClassName = classnames(
        'form__input form__input--with-button',
        { 'form__input--error': error },
    );

    const type = isPasswordShown ? 'text' : 'password';
    const icon = isPasswordShown ? 'open_eye' : 'closed_eye';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(id, e.target.value);
        }
    };

    const toggleInputType = () => {
        setIsPasswordShown((prev) => !prev);
    };

    return (
        <div className="form__item">
            <label>
                <div className="form__label">
                    {label}
                </div>
                <div className="form__input-wrapper">
                    <input
                        id={id}
                        name={id}
                        className={inputClassName}
                        type={type}
                        onChange={handleInputChange}
                        value={password}
                        placeholder={placeholder}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={focus}
                    />
                    <IconButton
                        name={icon}
                        className="form__input-btn form__input-btn--password"
                        onClick={toggleInputType}
                    />
                </div>
            </label>
        </div>
    );
};

export default PasswordField;
