import { browserApi } from '../browserApi';
import { userLocationService } from '../userLocationService';

/**
 * Service for managing VPN blocked notice display state.
 * Ensures the notice is shown only once per user in affected regions.
 */
class VpnBlockedNotice {
    /**
     * Storage key for tracking if notice was shown.
     */
    private static readonly HAS_SHOWN_KEY = 'vpn.blocked.notice.has.shown';

    /**
     * Determines if region notice should be shown to the user.
     * Returns true only for users in affected regions who haven't seen the notice yet.
     *
     * @returns True if notice should be shown, false otherwise.
     */
    public async shouldShowRegionNotice(): Promise<boolean> {
        const isInAffectedRegion = userLocationService.isUserInAffectedRegion();
        if (!isInAffectedRegion) {
            return false;
        }

        const hasShown = await this.hasBeenShown();
        return !hasShown;
    }

    /**
     * Checks if VPN blocked notice has been shown to the user.
     *
     * @returns True if notice has been shown, false otherwise.
     */
    public async hasBeenShown(): Promise<boolean> {
        const hasShown = await browserApi.storage.get<boolean>(VpnBlockedNotice.HAS_SHOWN_KEY);
        return !!hasShown;
    }

    /**
     * Marks the notice as shown.
     * Should be called after displaying the notice to the user.
     */
    public async markAsShown(): Promise<void> {
        await browserApi.storage.set(VpnBlockedNotice.HAS_SHOWN_KEY, true);
    }
}

export const vpnBlockedNotice = new VpnBlockedNotice();
