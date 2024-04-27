import { fallbackApi } from '../api/fallbackApi';
import { setExtensionUninstallUrl } from '../helpers';

/**
 * Class for handling forwarder domain. AG-32237.
 */
export class Forwarder {
    /**
     * Domain for the forwarder.
     */
    private domain: string;

    /**
     * Updates and returns the domain for the forwarder.
     *
     * If the forwarder domain is changed, it also updates the extension uninstall url with the new domain.
     *
     * @returns Forwarder domain.
     */
    public async updateAndGetDomain(): Promise<string> {
        const newDomain = await fallbackApi.getForwarderApiUrl();

        // update the extension uninstall url if forwarder domain is changed
        if (newDomain !== this.domain) {
            this.domain = newDomain;
            await setExtensionUninstallUrl(this.domain);
        }

        return this.domain;
    }
}

export const forwarder = new Forwarder();
