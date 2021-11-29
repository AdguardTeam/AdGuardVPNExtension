import React from 'react';
import cn from 'classnames';

import Icon from '../../ui/Icon';
import './checkbox.pcss';

export const Checkbox = ({
    id,
    checked,
    onChange,
    label,
    labelSize,
}) => {
    const onChangeHandler = (e) => {
        onChange(e.currentTarget.checked);
    };

    return (
            <label
                htmlFor={id}
                className="checkbox"
            >
                <div className="checkbox__marker">
                    <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        className="checkbox__input"
                        onChange={onChangeHandler}
                    />
                    <Icon
                        icon={checked ? 'checked' : 'unchecked'}
                        className="checkbox__icon"
                    />
                </div>
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
