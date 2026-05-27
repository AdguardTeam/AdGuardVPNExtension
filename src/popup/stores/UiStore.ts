import { action, computed, observable } from 'mobx';

import { type VariantCache } from '../../background/abTestManager/ABTestManager';
import { AG49792_PAYWALL_SLOT, AG49792_PAYWALL_B_VERSION_NAME } from '../../background/abTestManager/constants';
import { messenger } from '../../common/messenger';

import type { RootStore } from './RootStore';

export class UiStore {
    @observable public isOpenLocationsScreen: boolean = false;

    @observable public isOpenOptionsModal: boolean = false;

    @observable public isUsageDataModalOpen: boolean = false;

    @observable private isOpenRecovery: boolean = false;

    @observable private isConnecting: boolean = false;

    /**
     * Flag indicating if region notice should be shown.
     * Retrieved from backend.
     */
    @observable public shouldShowRegionNotice: boolean = false;

    /**
     * Flag for the notice if some locations are not available.
     *
     * Init value is `true`.
     */
    @observable public isShownVpnBlockedErrorNotice: boolean = true;

    /**
     * Flag for the details modal if some locations are not available.
     *
     * Init value is `false`.
     */
    @observable public isShownVpnBlockedErrorDetails: boolean = false;

    /**
     * Flag for the notice with timer for the limited offer for free accounts.
     *
     * Init value is `true`.
     */
    @observable public shouldShowLimitedOfferNotice: boolean = true;

    /**
     * Flag for the details modal for the limited offer.
     *
     * Init value is `false`.
     */
    @observable public shouldShowLimitedOfferDetails: boolean = false;

    /**
     * Flag for the mobile Edge promo modal display.
     *
     * Init value is `false`.
     */
    @observable public shouldShowMobileEdgePromoModal: boolean = false;

    /**
     * Flag for the streaming modal display.
     *
     * Init value is `false`.
     */
    @observable public isStreamingModalOpen: boolean = false;

    /**
     * Cached A/B experiment variant assignments.
     */
    @observable private experimentVariants: VariantCache = {};

    /**
     * Streaming platforms to display in the modal.
     */
    @observable public streamingPlatforms: string[] = [];

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action private enableConnecting = (): void => {
        this.isConnecting = true;
    };

    @action private disableConnecting = (): void => {
        this.isConnecting = false;
    };

    @action public openLocationsScreen = (): void => {
        this.isOpenLocationsScreen = true;
    };

    @action public closeLocationsScreen = (): void => {
        this.isOpenLocationsScreen = false;
    };

    @action public openOptionsModal = (): void => {
        this.isOpenOptionsModal = true;
    };

    @action public closeOptionsModal = (): void => {
        this.isOpenOptionsModal = false;
    };

    @action public openUsageDataModal = (): void => {
        this.isUsageDataModalOpen = true;
    };

    @action public closeUsageDataModal = (): void => {
        this.isUsageDataModalOpen = false;
    };

    @action public setShouldShowRegionNotice = (value: boolean): void => {
        this.shouldShowRegionNotice = value;
    };

    @action public openVpnBlockedErrorNotice = (): void => {
        this.isShownVpnBlockedErrorNotice = true;
    };

    @action public closeVpnBlockedErrorNotice = async (): Promise<void> => {
        this.isShownVpnBlockedErrorNotice = false;
        this.shouldShowRegionNotice = false;
        await messenger.markRegionNoticeAsShown();
    };

    @action public openVpnBlockedErrorDetails = (): void => {
        // hide the notice
        this.isShownVpnBlockedErrorNotice = false;
        // show the details
        this.isShownVpnBlockedErrorDetails = true;
    };

    @action public closeVpnBlockedErrorDetails = async (): Promise<void> => {
        this.isShownVpnBlockedErrorDetails = false;

        this.shouldShowRegionNotice = false;
        await messenger.markRegionNoticeAsShown();
    };

    /**
     * Opens the notice with timer for the limited offer.
     */
    @action public openLimitedOfferNotice = (): void => {
        this.shouldShowLimitedOfferNotice = true;
    };

    /**
     * Closes the notice with timer for the limited offer.
     */
    @action private closeLimitedOfferNotice = (): void => {
        this.shouldShowLimitedOfferNotice = false;
    };

    /**
     * Opens the details modal for the limited offer.
     */
    @action public openLimitedOfferDetails = (): void => {
        // hide the notice
        this.shouldShowLimitedOfferNotice = false;
        // show the details
        this.shouldShowLimitedOfferDetails = true;
    };

    /**
     * Closes the details modal for the limited offer.
     */
    @action public closeLimitedOfferDetails = (): void => {
        this.shouldShowLimitedOfferDetails = false;
    };

    /**
     * Opens the modal for the mobile edge extension promo.
     */
    @action public openMobileEdgePromoModal = (): void => {
        this.shouldShowMobileEdgePromoModal = true;
    };

    /**
     * Closes the modal for the mobile edge extension promo.
     */
    @action public closeMobileEdgePromoModal = (): void => {
        this.shouldShowMobileEdgePromoModal = false;
    };

    /**
     * Opens the streaming modal with the given platforms.
     *
     * @param platforms Array of streaming platform names.
     */
    @action public openStreamingModal = (platforms: string[]): void => {
        this.streamingPlatforms = platforms;
        this.isStreamingModalOpen = true;
    };

    /**
     * Closes the streaming modal.
     */
    @action public closeStreamingModal = (): void => {
        this.isStreamingModalOpen = false;
        this.streamingPlatforms = [];
    };

    /**
     * Sets experiment variant assignments.
     *
     * @param variants Variant cache from the background.
     */
    @action public setExperimentVariants(variants: VariantCache): void {
        this.experimentVariants = variants;
    }

    /**
     * Whether paywall B variant should be shown.
     * Part of AG-49792 AB test task.
     */
    @computed public get isPaywallBVariant(): boolean {
        return this.experimentVariants[AG49792_PAYWALL_SLOT] === AG49792_PAYWALL_B_VERSION_NAME;
    }
}
