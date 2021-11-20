import React, { useState } from 'react';

import './search.pcss';

export const Search = ({ placeholder }) => {
    const [searchValue, setSearchValue] = useState('');

    return (
        <form className="search">
            <input
                type="text"
                className="search__input"
                value={searchValue}
                placeholder={placeholder}
                onChange={(e) => setSearchValue(e.target.value)}
            />
        </form>
    );
};
