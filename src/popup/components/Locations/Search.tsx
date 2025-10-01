/* eslint-disable jsx-a11y/no-autofocus */
import React, { type ReactElement } from 'react';

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
}: SearchProps): ReactElement => {
    const crossClassNames = classnames('endpoints-search__clear', {
        'endpoints-search__clear--active': value.length > 0,
    });

    return (
        <div className="endpoints-search">
            <input
                autoFocus
                className="endpoints-search__input"
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
