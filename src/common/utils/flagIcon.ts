import browser from 'webextension-polyfill';

interface FlagIconStyle {
    /**
     * Background image URL.
     */
    backgroundImage?: string;
}

/**
 * Returns a background-image style object for a country flag icon.
 *
 * @param countryCode Two-letter ISO country code.
 * @returns Flag icon style object with background image,
 * or empty object if country code is not provided.
 */
export const getFlagIconStyle = (countryCode: string): FlagIconStyle => {
    if (!countryCode) {
        return {};
    }

    const iconName = countryCode.toLowerCase();
    const fullUrl = browser.runtime.getURL(`assets/images/flags/${iconName}.svg`);

    return { backgroundImage: `url("${fullUrl}")` };
};
