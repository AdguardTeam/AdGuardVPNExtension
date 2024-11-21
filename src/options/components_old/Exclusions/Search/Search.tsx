import React from 'react';

import './search.pcss';

interface SearchProps {
    placeholder: React.ReactNode,
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

    return (
        <form className="search">
            <label className="input">
                <input
                    type="text"
                    className="input__in input__in--clear"
                    value={value}
                    placeholder={placeholder?.toString()}
                    onChange={handleChange}
                />
                {value.length > 0 && (
                    <button
                        type="button"
                        className="button input__clear"
                        onClick={handleClear}
                    >
                        <svg className="icon icon--button icon--cross">
                            <use xlinkHref="#cross" />
                        </svg>
                    </button>
                )}
            </label>
        </form>
    );
};
