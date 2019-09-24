export const lazyGet = (obj, prop, func) => {
    const cachedProp = `_${prop}`;
    if (cachedProp in obj) {
        return obj[cachedProp];
    }

    const value = func.apply(obj);
    // eslint-disable-next-line no-param-reassign
    obj[cachedProp] = value;
    return value;
};

/**
 * Returns hostname of url if it was correct, otherwise return input url
 * @param {string} url
 * @returns {string}
 */
export const getHostname = (url) => {
    let urlObj;

    try {
        urlObj = new URL(url);
    } catch (e) {
        return url;
    }

    return urlObj.hostname;
};
