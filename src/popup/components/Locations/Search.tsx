/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';

import classnames from 'classnames';

import { translator } from '../../../common/translator';
import { IconButton } from '../../../common/components/Icons';

/**
 * Search component props.
 */
export interface SearchProps {
    /**
     * Current input value;
     */
    value: string;

    /**
     * On change event handler.
     */
    onChange: React.ChangeEventHandler<HTMLInputElement>;

    /**
     * On clear event handler.
     */
    onClear: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Search component used in locations.
 */
export const Search = ({
    value,
    onChange,
    onClear,
}: SearchProps) => {
    const crossClassNames = classnames(
        'form__input-btn',
        { 'form__input-btn--active': value.length > 0 },
    );

    return (
        <div className="endpoints__search form__input-wrapper">
            <input
                autoFocus
                className="form__input form__input--with-button"
                type="text"
                placeholder={translator.getMessage('endpoints_search')}
                value={value}
                onChange={onChange}
            />
            <IconButton
                name="cross"
                className={crossClassNames}
                onClick={onClear}
            />
        </div>
    );
};
