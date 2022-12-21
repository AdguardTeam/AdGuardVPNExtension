/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';
import classnames from 'classnames';

import { translator } from '../../../common/translator';

type SearchProps = {
    value: string,
    handleChange: React.ChangeEventHandler<HTMLInputElement>,
    handleClear: React.MouseEventHandler<HTMLButtonElement>,
};

export const Search = ({ value, handleChange, handleClear }: SearchProps) => {
    const crossClassNames = classnames(
        'button button--close endpoints__cross',
        { 'endpoints__cross--active': value.length > 0 },
    );

    return (
        <div className="endpoints__search">
            <input
                autoFocus
                className="endpoints__search-in"
                type="text"
                placeholder={translator.getMessage('endpoints_search')}
                value={value}
                onChange={handleChange}
            />
            <button
                type="button"
                className={crossClassNames}
                onClick={handleClear}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
        </div>
    );
};
