import { Prefs } from '../../common/prefs';
import { browserApi } from '../browserApi';
import { type StorageInterface } from '../browserApi/storage';

/**
 * Service to handle the mobile Edge promo banner.
 */
class MobileEdgePromoService {
    /**
     * Key to store the state of the mobile Edge promo banner in browser local storage.
     */
    private static readonly WAS_BANNER_HIDDEN_KEY = 'mobile.edge.promo.banner.hidden.state';

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Constructor.
     */
    constructor() {
        this.storage = browserApi.storage;
    }

    /**
     * Hides the mobile Edge promo banner so it won't be shown anymore.
     */
    public async hideBanner(): Promise<void> {
        await this.storage.set(MobileEdgePromoService.WAS_BANNER_HIDDEN_KEY, true);
    }

    /**
     * Checks whether the mobile Edge promo banner should be shown which happens only:
     * + for desktop users;
     * + in Edge browser;
     * + if it was not hidden by user directly in popup via "x" button
     *   or by pressing "Don't show this again" button.
     *
     * @returns True if the mobile Edge promo banner should be shown, false otherwise.
     */
    public async shouldShowBanner(): Promise<boolean> {
        const isMobile = await Prefs.isAndroid();

        const wasHidden = await this.storage.get<boolean>(MobileEdgePromoService.WAS_BANNER_HIDDEN_KEY);

        return !isMobile
            && Prefs.isEdge()
            && !wasHidden;
    }
}

export const mobileEdgePromoService = new MobileEdgePromoService();
