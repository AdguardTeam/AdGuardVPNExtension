const indexOfIgnoreCase = (str: string, searchString: string): number => {
    return str.toLowerCase().indexOf(searchString.toLowerCase());
};

export const containsIgnoreCase = (str: string, searchString: string): boolean => {
    return !!(str && searchString && indexOfIgnoreCase(str, searchString) >= 0);
};

export const findChunks = (str: string, searchString: string, chunks: string[] = []): string[] => {
    const ind = indexOfIgnoreCase(str, searchString);
    if (ind > -1) {
        chunks.push(str.slice(0, ind));
        chunks.push(str.slice(ind, ind + searchString.length));
        const restStr = str.slice(ind + searchString.length);
        if (containsIgnoreCase(restStr, searchString)) {
            findChunks(restStr, searchString, chunks);
        } else {
            chunks.push(restStr);
        }
    }
    return chunks.filter((i) => !!i);
};
