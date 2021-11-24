import React from 'react';

import './search.pcss';
import Icon from '../../../../popup/components/ui/Icon';

interface SearchProps {
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    onClear: () => void,
}

export const Search = ({
    placeholder,
    value,
    onChange,
    onClear,
}: SearchProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleClear = () => {
        onClear();
    };

    const showClearIcon = value.length > 0;

    return (
        <form className="search">
            <input
                type="text"
                className="search__input"
                value={value}
                placeholder={placeholder}
                onChange={handleChange}
            />
            {/* FIXME fix style */}
            {showClearIcon && (
                <button
                    type="button"
                    className="button search__clear"
                    onClick={handleClear}
                >
                    <Icon icon="cross" className="search__cross" />
                </button>
            )}
        </form>
    );
};
