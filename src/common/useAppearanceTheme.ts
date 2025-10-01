import { useLayoutEffect } from 'react';

import throttle from 'lodash/throttle';

import { AppearanceTheme } from './constants';

export const THEME_STORAGE_KEY = 'appearance_theme';

export const getThemeFromLocalStorage = (): string | null => {
    return localStorage.getItem(THEME_STORAGE_KEY);
};

export const useAppearanceTheme = (appearanceTheme: string | null): void => {
    useLayoutEffect(() => {
        const DARK_THEME_CLASS = 'dark-mode';
        const LIGHT_THEME_CLASS = 'light-mode';
        const SET_TO_STORAGE_TIMEOUT = 500;

        const throttledSetToStorage = throttle((mode: string): void => {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        }, SET_TO_STORAGE_TIMEOUT);

        let theme = appearanceTheme;

        if (!theme) {
            const themeBkp = getThemeFromLocalStorage();
            if (typeof themeBkp === 'string') {
                theme = themeBkp;
            }
        } else {
            throttledSetToStorage(theme);
        }

        switch (theme) {
            case AppearanceTheme.Dark: {
                document.documentElement.classList.add(DARK_THEME_CLASS);
                document.documentElement.classList.remove(LIGHT_THEME_CLASS);
                break;
            }
            case AppearanceTheme.Light: {
                document.documentElement.classList.add(LIGHT_THEME_CLASS);
                document.documentElement.classList.remove(DARK_THEME_CLASS);
                break;
            }
            default: {
                document.documentElement.classList.remove(DARK_THEME_CLASS);
                document.documentElement.classList.remove(LIGHT_THEME_CLASS);
            }
        }
    }, [appearanceTheme]);
};
