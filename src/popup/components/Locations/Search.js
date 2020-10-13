/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';
import classnames from 'classnames';

import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Search = ({ value, handleChange, handleClear }) => {
    const crossClassNames = classnames(
        'button endpoints__cross',
        { 'endpoints__cross--active': value.length > 0 }
    );

    return (
        <div className="endpoints__search">
            <input
                autoFocus
                className="endpoints__search-in"
                type="text"
                placeholder={reactTranslator.translate('endpoints_search')}
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

export default Search;
