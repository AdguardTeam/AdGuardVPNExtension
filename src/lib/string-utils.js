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
 * @param url
 * @param pattern
 * @returns {boolean}
 */
export const shExpMatch = (url, pattern) => {
    let regexpStr = pattern.replace(/\./g, '\\.');
    regexpStr = regexpStr.replace(/\*/g, '.*');
    const regexp = new RegExp(`^${regexpStr}$`);
    return regexp.test(url);
};
