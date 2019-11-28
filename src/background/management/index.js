import browser from 'webextension-polyfill';
import log from '../../lib/logger';

const PROXY_PERMISSION = 'proxy';

/**
 * Returns list of enabled extensions with proxy permission, except extension itself
 * @returns {Promise<*>}
 */
const getEnabledProxyExtensions = async () => {
    const extensions = await browser.management.getAll();
    return extensions.filter((extension) => {
        const { permissions, enabled, id } = extension;
        return permissions.includes(PROXY_PERMISSION) && id !== browser.runtime.id && enabled;
    });
};

const turnOffProxyExtensions = async () => {
    const enabledProxyExtensions = await getEnabledProxyExtensions();

    const promises = enabledProxyExtensions.map(async (extension) => {
        try {
            await browser.management.setEnabled(extension.id, false);
        } catch (e) {
            log.error(e);
        }
    });

    await Promise.all(promises);
};

const management = {
    turnOffProxyExtensions,
};

export default management;
