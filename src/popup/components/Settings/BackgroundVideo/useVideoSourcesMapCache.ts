import { useState, useEffect } from 'react';
import { videoSourcesMap } from '../../../../lib/constants';

export const useVideoSourcesMapCache = () => {
    const [sourcesMap, setSourcesMap] = useState(videoSourcesMap);

    const createCachedUrl = async (url: string): Promise<string> => {
        const res = await fetch(url);
        const blob = await res.blob();

        return URL.createObjectURL(blob);
    };

    const createCachedSources = async (sources: Record<string, string>) => {
        const tasks = Object
            .entries(sources)
            .map(async ([key, value]) => [key, await createCachedUrl(value)]);

        const entries = await Promise.all(tasks);

        return Object.fromEntries(entries);
    };

    const createCachedSourcesMap = async (sourcesMap: Record<string, any>) => {
        const tasks = Object
            .entries(sourcesMap)
            .map(async ([key, value]) => [key, await createCachedSources(value)]);

        const entries = await Promise.all(tasks);

        return Object.fromEntries(entries);
    };

    useEffect(() => {
        (async () => {
            setSourcesMap(await createCachedSourcesMap(videoSourcesMap));
        })();
    }, []);

    return sourcesMap;
};
