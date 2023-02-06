import { AppearanceTheme, THEME_URL_PARAMETER } from '../lib/constants';

/*
    this script is injected at the top of the page to display
    the desired color theme before the main bundle is loaded
*/
((): void => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const theme = urlSearchParams.get(THEME_URL_PARAMETER);
    /*
        if theme parameter is missing or a system theme is selected,
        the desired color is selected using the css media query
    */
    if (!theme || theme === AppearanceTheme.System) {
        return;
    }
    // the color changes through the selector
    // so that it could be rewritten by css from the main bundle
    if (theme === AppearanceTheme.Dark) {
        document.body.classList.add('body_dark');
    }
    if (theme === AppearanceTheme.Light) {
        document.body.classList.add('body_light');
    }
})();
