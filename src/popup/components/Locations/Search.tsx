/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';

import classnames from 'classnames';

import { translator } from '../../../common/translator';

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
        'button button--close endpoints__cross',
        { 'endpoints__cross--active': value.length > 0 },
    );

    return (
        <div className="endpoints__search">
            <input
                autoFocus
                className="form__input endpoints__search-in"
                type="text"
                placeholder={translator.getMessage('endpoints_search')}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                className={crossClassNames}
                onClick={onClear}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
        </div>
    );
};
