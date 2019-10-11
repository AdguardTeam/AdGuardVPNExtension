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
