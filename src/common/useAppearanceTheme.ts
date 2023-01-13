import throttle from 'lodash/throttle';
import { useLayoutEffect } from 'react';
import { browserApi } from '../background/browserApi';

import { APPEARANCE_THEMES } from '../lib/constants';

export const THEME_STORAGE_KEY = 'appearance_theme';

export const useAppearanceTheme = (appearanceTheme: string | null) => {
    useLayoutEffect(() => {
        const DARK_THEME_CLASS = 'dark-mode';
        const LIGHT_THEME_CLASS = 'light-mode';
        const SET_TO_STORAGE_TIMEOUT = 500;

        const throttledSetToStorage = throttle(async (mode: string) => {
            await browserApi.storage.set(THEME_STORAGE_KEY, mode);
        }, SET_TO_STORAGE_TIMEOUT);

        let theme = appearanceTheme;

        const getThemeFromLocalStorage = async () => {
            return browserApi.storage.get(THEME_STORAGE_KEY);
        };

        (async () => {
            if (!theme) {
                const themeBkp = await getThemeFromLocalStorage();
                if (typeof themeBkp === 'string') {
                    theme = themeBkp;
                }
            } else {
                throttledSetToStorage(theme);
            }

            switch (theme) {
                case APPEARANCE_THEMES.DARK: {
                    document.documentElement.classList.add(DARK_THEME_CLASS);
                    document.documentElement.classList.remove(LIGHT_THEME_CLASS);
                    break;
                }
                case APPEARANCE_THEMES.LIGHT: {
                    document.documentElement.classList.add(LIGHT_THEME_CLASS);
                    document.documentElement.classList.remove(DARK_THEME_CLASS);
                    break;
                }
                default: {
                    document.documentElement.classList.remove(DARK_THEME_CLASS);
                    document.documentElement.classList.remove(LIGHT_THEME_CLASS);
                }
            }
        })();
    }, [appearanceTheme]);
};
