import { forwarder } from './forwarder';
import { setExtensionUninstallUrl } from './helpers';

/**
 * Sets uninstall url for the extension.
 */
export const setUninstallUrl = async (): Promise<void> => {
    const forwarderDomain = await forwarder.updateAndGetDomain();
    await setExtensionUninstallUrl(forwarderDomain);
};
