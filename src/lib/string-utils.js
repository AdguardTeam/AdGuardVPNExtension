/* eslint-disable no-useless-escape */
/**
 * Renders string templates
 *
 * e.g.
 * const template = "https://{{host}}/path"
 * const tags = { host: example.org }
 * console.log(renderTemplate(template, tags)); -> outputs: "https://example.org/path"
 *
 * @param {string} template
 * @param {object} tags
 * @returns {string}
 */
export const renderTemplate = (template, tags) => {
    return Object.entries(tags).reduce((acc, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return acc.replace(regex, value);
    }, template);
};

/**
 * Converts string into Uint8Array
 * @param str
 * @returns {!Uint8Array}
 */
export const stringToUint8Array = (str) => {
    return new TextEncoder('utf-8').encode(str);
};

/**
 * Compares if two hostnames w/ or w/o www are equal
 * @param hostnameA
 * @param hostnameB
 * @returns {boolean}
 */
export const areHostnamesEqual = (hostnameA, hostnameB) => {
    const wwwRegex = /^www\./;
    const oldHostnameWithoutWww = hostnameA.replace(wwwRegex, '');
    const newHostnameWithoutWww = hostnameB.replace(wwwRegex, '');
    return oldHostnameWithoutWww === newHostnameWithoutWww;
};

/**
 * Checks is wildcard pattern matches with url
 * IMPORTANT - note that regexp asserts position at the end of the string
 * @param {string} url - hostname or url
 * @param {string} pattern
 * @returns {boolean}
 */
export const shExpMatch = (url, pattern) => {
    let regexpStr = pattern.replace(/\./g, '\\.');
    regexpStr = regexpStr.replace(/\*/g, '.*');
    const regexp = new RegExp(`^${regexpStr}$`);
    return regexp.test(url);
};

/**
 * Checks if string is valid url with http: or https: protocol
 * @param {string} str
 * @returns {boolean}
 */
export const isHttp = (str) => {
    let url;
    try {
        url = new URL(str);
    } catch (e) {
        return false;
    }
    return /^https?:/.test(url.protocol);
};

/**
 * Checks if provided string is valid exclusion
 */
export const isValidExclusion = (exclusion) => {
    // Regexp validates simple domains and exclusions with wildcard
    // e.g "*.example.org", "example.org", more cases can be found in tests
    const VALID_EXCLUSION_REGEX = /^((\*|[\w\u0400-\u04FF][\w_\-.\u0400-\u04FF\u00FC]*)\.([a-z\u0400-\u04FF]{2,8}|\*)|(25[0-5]|2[0-4]\d|(1\d{2})|[1-9]\d|[1-9])\.((25[0-5]|2[0-4]\d|(1\d{2})|(\d{1,2}))\.){2}(25[0-5]|2[0-4]\d|(1\d{2})|(\d{1,2})))[^\s]*$/;
    return VALID_EXCLUSION_REGEX.test(exclusion);
};
