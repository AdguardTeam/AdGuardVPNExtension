import React from 'react';
import cn from 'classnames';
import { nanoid } from 'nanoid';

import { containsIgnoreCase, findChunks } from './helpers';

import './highlighter.pcss';

interface SearchHighlighterProps {
    value: string,
    search: string,
}

export const SearchHighlighter = ({ value, search }: SearchHighlighterProps) => {
    const renderStr = () => {
        const chunks = findChunks(value, search);

        return chunks.map((chunk) => {
            const isSearchMatch = chunk.toLowerCase() === search.toLowerCase();

            const chunkClassName = cn({
                search__highlight: isSearchMatch,
            });

            return (
                <span
                    key={nanoid()}
                    className={chunkClassName}
                >
                    {chunk}
                </span>
            );
        });
    };

    if (search.length > 0 && containsIgnoreCase(value, search)) {
        return (
            <>
                {renderStr()}
            </>
        );
    }

    return <>{value}</>;
};
