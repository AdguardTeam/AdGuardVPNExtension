import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';

import { messenger } from '../../common/messenger';
import { FLAGS_FIELDS } from '../../common/constants';
import { AuthCacheKey, type AuthCacheValue } from '../../background/authentication/authCacheTypes';

import { RequestStatus } from './constants';
import type { RootStore } from './RootStore';

const DEFAULTS = {
    authenticated: false,
    authenticatedStatusRetrieved: false,
    policyAgreement: false,
    helpUsImprove: false,
    marketingConsent: false,
};

export class AuthStore {
    @observable authenticated = DEFAULTS.authenticated;

    @observable authenticatedStatusRetrieved = DEFAULTS.authenticatedStatusRetrieved;

    @observable policyAgreement = DEFAULTS.policyAgreement;

    @observable helpUsImprove = DEFAULTS.helpUsImprove;

    @observable marketingConsent = DEFAULTS.marketingConsent;

    @observable requestProcessState = RequestStatus.Done;

    @observable isNewUser: boolean;

    @observable isFirstRun: boolean;

    @observable isSocialAuth: boolean;

    @observable showOnboarding: boolean;

    @observable showUpgradeScreen: boolean;

    @observable forceShowUpgradeScreen: boolean = false;

    @observable showRateModal = false;

    @observable showConfirmRateModal = false;

    @observable rating = 0;

    @observable showHintPopup = false;

    /**
     * Is WebAuth flow started.
     * Used to show auth loading screen.
     */
    @observable isWebAuthFlowStarted = false;

    /**
     * Is WebAuth flow loading.
     * Used to show auth loading spinner.
     */
    @observable isWebAuthFlowLoading = false;

    /**
     * Is WebAuth flow has error.
     * Used to show "Failed to Login" modal.
     */
    @observable isWebAuthFlowHasError = false;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action getAuthCacheFromBackground = async () => {
        const {
            policyAgreement,
            helpUsImprove,
            marketingConsent,
            isWebAuthFlowStarted,
            isWebAuthFlowLoading,
            isWebAuthFlowHasError,
        } = await messenger.getAuthCache();
        runInAction(() => {
            this.policyAgreement = policyAgreement;
            this.helpUsImprove = helpUsImprove;
            this.marketingConsent = marketingConsent;
            this.isWebAuthFlowStarted = isWebAuthFlowStarted;
            this.isWebAuthFlowLoading = isWebAuthFlowLoading;
            this.isWebAuthFlowHasError = isWebAuthFlowHasError;
        });
    };

    @action setFlagsStorageData = (flagsStorageData: { [key: string]: boolean }) => {
        this.isNewUser = flagsStorageData[FLAGS_FIELDS.IS_NEW_USER];
        this.isSocialAuth = flagsStorageData[FLAGS_FIELDS.IS_SOCIAL_AUTH];
        this.showOnboarding = flagsStorageData[FLAGS_FIELDS.SHOW_ONBOARDING];
        this.showUpgradeScreen = flagsStorageData[FLAGS_FIELDS.SHOW_UPGRADE_SCREEN];
        this.showRateModal = flagsStorageData[FLAGS_FIELDS.SHOULD_SHOW_RATE_MODAL];
    };

    @action setShowOnboarding = async (value: boolean) => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_ONBOARDING, value);
        runInAction(() => {
            this.showOnboarding = value;
        });
    };

    @action setShowUpgradeScreen = async (value: boolean) => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, value);
        runInAction(() => {
            this.showUpgradeScreen = value;

            // Reset forceShowUpgradeScreen if showUpgradeScreen is set to false
            if (!value) {
                this.forceShowUpgradeScreen = false;
            }
        });
    };

    @action setForceShowUpgradeScreen = (value: boolean) => {
        this.forceShowUpgradeScreen = value;
    };

    @action setIsFirstRun = (value: boolean) => {
        this.isFirstRun = value;
    };

    // AG-10009 Newsletter subscription screen
    @computed
    get renderNewsletter() {
        return this.marketingConsent === null
            && ((this.isFirstRun && this.isSocialAuth)
                || (this.isNewUser && !this.isSocialAuth));
    }

    // AG-10009 Promo screens (onboarding and upgrade screen) should be shown
    // only on first run or for new users authenticated via mail
    @computed
    get shouldRenderPromo() {
        return this.isFirstRun || (this.isNewUser && !this.isSocialAuth);
    }

    @computed
    get renderOnboarding() {
        return this.showOnboarding && this.shouldRenderPromo;
    }

    @computed
    get renderUpgradeScreen() {
        return this.forceShowUpgradeScreen || (this.showUpgradeScreen && this.shouldRenderPromo);
    }

    @action setIsAuthenticated = (value: boolean) => {
        this.authenticated = value;
    };

    @action setAuthenticatedStatusRetrieved = (value: boolean) => {
        this.authenticatedStatusRetrieved = value;
    };

    @action deauthenticate = async () => {
        this.authenticated = false;
        await messenger.deauthenticateUser();
    };

    @action setPolicyAgreement = async (value: boolean) => {
        await messenger.updateAuthCache(AuthCacheKey.PolicyAgreement, value);
        runInAction(() => {
            this.policyAgreement = value;
        });
    };

    @action setHelpUsImprove = async (value: boolean) => {
        await messenger.updateAuthCache(AuthCacheKey.HelpUsImprove, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action onPolicyAgreementReceived = async () => {
        await messenger.setConsentData(this.policyAgreement, this.helpUsImprove);
    };

    @action setMarketingConsent = async (value: boolean) => {
        await messenger.updateAuthCache(AuthCacheKey.MarketingConsent, value);
        runInAction(() => {
            this.marketingConsent = value;
        });
    };

    /**
     * Handles updates to the authentication cache.
     *
     * @param field The field to update.
     * @param value The new value for the field.
     */
    @action handleAuthCacheUpdate = (field: AuthCacheKey, value: AuthCacheValue) => {
        switch (field) {
            case AuthCacheKey.PolicyAgreement:
                this.policyAgreement = value;
                break;
            case AuthCacheKey.HelpUsImprove:
                this.helpUsImprove = value;
                break;
            case AuthCacheKey.MarketingConsent:
                this.marketingConsent = value;
                break;
            case AuthCacheKey.IsWebAuthFlowStarted:
                this.isWebAuthFlowStarted = value;
                break;
            case AuthCacheKey.IsWebAuthFlowLoading:
                this.isWebAuthFlowLoading = value;
                break;
            case AuthCacheKey.IsWebAuthFlowHasError:
                this.isWebAuthFlowHasError = value;
                break;
            default:
                break;
        }
    };

    /**
     * Starts the web authentication flow.
     */
    @action startWebAuthFlow = async () => {
        this.requestProcessState = RequestStatus.Pending;
        await messenger.startWebAuthFlow(this.marketingConsent);
    };

    /**
     * Reopens the web authentication flow.
     */
    @action reopenWebAuthFlow = async () => {
        // If web auth flow is not loading, we should start again
        if (!this.isWebAuthFlowLoading) {
            await this.startWebAuthFlow();
            return;
        }

        // Otherwise, just re-open it
        await messenger.reopenWebAuthFlow();
    };

    /**
     * Cancels the web authentication flow.
     */
    @action cancelWebAuthFlow = async () => {
        await messenger.cancelWebAuthFlow();
        runInAction(() => {
            this.requestProcessState = RequestStatus.Done;
        });
    };

    /**
     * Closes "Failed to login" modal in auth screen.
     */
    @action closeFailedToLoginModal = async (): Promise<void> => {
        await messenger.updateAuthCache(AuthCacheKey.IsWebAuthFlowHasError, false);
    };

    @action setRating = (value: number) => {
        this.rating = value;
    };

    /**
     * Closes rate modal without rating.
     */
    @action closeRateModal = async () => {
        await messenger.hideRateModalAfterCancel();
        runInAction(() => {
            this.showRateModal = false;
        });
    };

    /**
     * Closes rate modal and opens confirm rate modal.
     */
    @action openConfirmRateModal = () => {
        this.showRateModal = false;
        this.showConfirmRateModal = true;
    };

    /**
     * Closes confirm rate modal after rating.
     */
    @action closeConfirmRateModalAfterRate = async () => {
        await messenger.hideRateModalAfterRate();
        runInAction(() => {
            this.showConfirmRateModal = false;
        });
    };

    /**
     * Closes confirm rate modal without rating.
     */
    @action closeConfirmRateModalAfterCancel = async () => {
        await messenger.hideRateModalAfterCancel();
        runInAction(() => {
            this.showConfirmRateModal = false;
        });
    };

    /**
     * Sets new value for {@link showRateModal}.
     */
    @action setShouldShowRateModal = (value: boolean) => {
        this.showRateModal = value;
    };

    @computed
    get shouldShowHintPopup() {
        // Here we exclude the possibility of a modal window overlapping the hint.
        // TODO: It should be done with correct z-index (AG-24339)
        return this.showHintPopup
            && !this.showRateModal
            && !this.showConfirmRateModal
            && !this.rootStore.settingsStore.showServerErrorPopup
            && !this.rootStore.settingsStore.isVpnBlocked
            // host permissions should be granted to show the hint popup;
            // no `!` is used because of its semantics
            && this.rootStore.settingsStore.isHostPermissionsGranted
            && !this.rootStore.settingsStore.isLimitedOfferActive
            && !this.rootStore.settingsStore.showNotificationModal
            && !this.rootStore.vpnStore.tooManyDevicesConnected;
    }

    @action setShowHintPopup = (value: boolean) => {
        this.showHintPopup = value;
    };

    @action closeHintPopup = async () => {
        await messenger.setHintPopupViewed();
        runInAction(() => {
            this.showHintPopup = false;
        });
    };
}
