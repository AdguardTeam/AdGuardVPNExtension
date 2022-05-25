import React from 'react';
import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';

const InputField = ({
    id,
    type,
    value,
    inputChangeHandler,
    error,
    className = '',
    placeholder = '',
}) => {
    const inputClassName = classnames(
        `form__input ${className}`,
        { 'form__input--error': error },
    );

    return (
        <div className="form__item">
            <label>
                <div className="form__label">
                    {reactTranslator.getMessage('auth_sign_in_provider_adguard_label')}
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
                />
            </label>
        </div>
    );
};

export default InputField;
