import { action, observable } from 'mobx';

import type { RootStore } from './RootStore';

export class UiStore {
    @observable isOpenLocationsScreen: boolean = false;

    @observable isOpenOptionsModal: boolean = false;

    @observable isUsageDataModalOpen: boolean = false;

    @observable isOpenRecovery: boolean = false;

    @observable isConnecting: boolean = false;

    /**
     * Flag for the notice if some locations are not available.
     *
     * Init value is `true`.
     */
    @observable isShownVpnBlockedErrorNotice: boolean = true;

    /**
     * Flag for the details modal if some locations are not available.
     *
     * Init value is `false`.
     */
    @observable isShownVpnBlockedErrorDetails: boolean = false;

    /**
     * Flag for the notice with timer for the limited offer for free accounts.
     *
     * Init value is `true`.
     */
    @observable shouldShowLimitedOfferNotice: boolean = true;

    /**
     * Flag for the details modal for the limited offer.
     *
     * Init value is `false`.
     */
    @observable shouldShowLimitedOfferDetails: boolean = false;

    /**
     * Flag for the mobile Edge promo modal display.
     *
     * Init value is `false`.
     */
    @observable shouldShowMobileEdgePromoModal: boolean = false;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action enableConnecting = (): void => {
        this.isConnecting = true;
    };

    @action disableConnecting = (): void => {
        this.isConnecting = false;
    };

    @action openLocationsScreen = (): void => {
        this.isOpenLocationsScreen = true;
    };

    @action closeLocationsScreen = (): void => {
        this.isOpenLocationsScreen = false;
    };

    @action openOptionsModal = (): void => {
        this.isOpenOptionsModal = true;
    };

    @action closeOptionsModal = (): void => {
        this.isOpenOptionsModal = false;
    };

    @action openUsageDataModal = (): void => {
        this.isUsageDataModalOpen = true;
    };

    @action closeUsageDataModal = (): void => {
        this.isUsageDataModalOpen = false;
    };

    @action openVpnBlockedErrorNotice = (): void => {
        this.isShownVpnBlockedErrorNotice = true;
    };

    @action closeVpnBlockedErrorNotice = (): void => {
        this.isShownVpnBlockedErrorNotice = false;
    };

    @action openVpnBlockedErrorDetails = (): void => {
        // hide the notice
        this.isShownVpnBlockedErrorNotice = false;
        // show the details
        this.isShownVpnBlockedErrorDetails = true;
    };

    @action closeVpnBlockedErrorDetails = (): void => {
        this.isShownVpnBlockedErrorDetails = false;
    };

    /**
     * Opens the notice with timer for the limited offer.
     */
    @action openLimitedOfferNotice = (): void => {
        this.shouldShowLimitedOfferNotice = true;
    };

    /**
     * Closes the notice with timer for the limited offer.
     */
    @action closeLimitedOfferNotice = (): void => {
        this.shouldShowLimitedOfferNotice = false;
    };

    /**
     * Opens the details modal for the limited offer.
     */
    @action openLimitedOfferDetails = (): void => {
        // hide the notice
        this.shouldShowLimitedOfferNotice = false;
        // show the details
        this.shouldShowLimitedOfferDetails = true;
    };

    /**
     * Closes the details modal for the limited offer.
     */
    @action closeLimitedOfferDetails = (): void => {
        this.shouldShowLimitedOfferDetails = false;
    };

    /**
     * Opens the modal for the mobile edge extension promo.
     */
    @action openMobileEdgePromoModal = (): void => {
        this.shouldShowMobileEdgePromoModal = true;
    };

    /**
     * Closes the modal for the mobile edge extension promo.
     */
    @action closeMobileEdgePromoModal = (): void => {
        this.shouldShowMobileEdgePromoModal = false;
    };
}
