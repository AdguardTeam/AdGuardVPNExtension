import { AppearanceTheme, THEME_URL_PARAMETER } from '../common/constants';

/**
 * this script is injected at the top of the page to display
 * the desired color theme before the main bundle is loaded
 */
((): void => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const theme = urlSearchParams.get(THEME_URL_PARAMETER);

    if (!theme) {
        return;
    }

    // the color changes through the selector
    // so that it could be rewritten by css from the main bundle
    if (theme === AppearanceTheme.Dark) {
        document.body.classList.add('body_dark');
    } else if (theme === AppearanceTheme.Light) {
        document.body.classList.add('body_light');
    }

    // Remove theme parameter from the URL. Removing is needed to avoid chrome opening the new options page every
    // time
    urlSearchParams.delete(THEME_URL_PARAMETER);
    let newSearchString = urlSearchParams.toString();
    newSearchString = newSearchString ? `?${newSearchString}` : '';
    const newUrl = `${window.location.origin}${window.location.pathname}${newSearchString}${window.location.hash}`;
    window.history.replaceState({}, '', newUrl); // Update the URL without reloading the page
})();
