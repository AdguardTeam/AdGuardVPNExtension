import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';

import { messenger } from '../../common/messenger';
import { FLAGS_FIELDS } from '../../common/constants';
import { type AuthCacheData, AuthCacheKey } from '../../background/authentication/authCacheTypes';
import { WebAuthAction, WebAuthState } from '../../background/auth/webAuthEnums';

import { RequestStatus } from './constants';
import type { RootStore } from './RootStore';

export class AuthStore {
    @observable authenticated = false;

    @observable authenticatedStatusRetrieved = false;

    @observable policyAgreement = false;

    @observable helpUsImprove = false;

    @observable marketingConsent = false;

    @observable requestProcessState = RequestStatus.Done;

    @observable isNewUser: boolean;

    @observable isFirstRun: boolean;

    @observable showNewsletter: boolean;

    @observable showOnboarding: boolean;

    @observable showUpgradeScreen: boolean;

    @observable forceShowUpgradeScreen: boolean = false;

    @observable showRateModal = false;

    @observable showConfirmRateModal = false;

    @observable rating = 0;

    @observable showHintPopup = false;

    @observable username: string | null = null;

    /**
     * Current state of web authentication flow.
     */
    @observable webAuthFlowState = WebAuthState.Idle;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action getAuthCacheFromBackground = async (): Promise<void> => {
        const {
            policyAgreement,
            helpUsImprove,
            webAuthFlowState,
        } = await messenger.getConsentData();
        runInAction(() => {
            this.policyAgreement = policyAgreement;
            this.helpUsImprove = helpUsImprove;
            this.webAuthFlowState = webAuthFlowState;
        });
    };

    @action setFlagsStorageData = (flagsStorageData: { [key: string]: boolean }): void => {
        this.isNewUser = flagsStorageData[FLAGS_FIELDS.IS_NEW_USER];
        this.showNewsletter = flagsStorageData[FLAGS_FIELDS.SHOW_NEWSLETTER];
        this.showOnboarding = flagsStorageData[FLAGS_FIELDS.SHOW_ONBOARDING];
        this.showUpgradeScreen = flagsStorageData[FLAGS_FIELDS.SHOW_UPGRADE_SCREEN];
        this.showRateModal = flagsStorageData[FLAGS_FIELDS.SHOULD_SHOW_RATE_MODAL];
    };

    /**
     * Sets user decision on marketing consent on store only.
     *
     * @param value Value indicating whether the user consents to marketing.
     */
    @action setMarketingConsent = async (value: boolean): Promise<void> => {
        this.marketingConsent = value;
    };

    /**
     * Updates user decision on marketing consent both locally and on background.
     *
     * @param value Value indicating whether the user consents to marketing.
     */
    @action updateMarketingConsent = async (value: boolean): Promise<void> => {
        // Note: no matter what decision choose user, we should close newsletter
        await Promise.all([
            messenger.updateMarketingConsent(value),
            messenger.setFlag(FLAGS_FIELDS.SHOW_NEWSLETTER, false),
        ]);
        runInAction(() => {
            this.marketingConsent = value;
            this.showNewsletter = false;
        });
    };

    @action setShowOnboarding = async (value: boolean): Promise<void> => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_ONBOARDING, value);
        runInAction(() => {
            this.showOnboarding = value;
        });
    };

    @action setShowUpgradeScreen = async (value: boolean): Promise<void> => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, value);
        runInAction(() => {
            this.showUpgradeScreen = value;

            // Reset forceShowUpgradeScreen if showUpgradeScreen is set to false
            if (!value) {
                this.forceShowUpgradeScreen = false;
            }
        });
    };

    @action setForceShowUpgradeScreen = (value: boolean): void => {
        this.forceShowUpgradeScreen = value;
    };

    @action setIsFirstRun = (value: boolean): void => {
        this.isFirstRun = value;
    };

    /**
     * AG-10009 Promo screens should be shown only on first run or for new users authenticated.
     * Promo screens:
     * - Newsletter Screen
     * - Onboarding Screen
     * - Upgrade Screen
     */
    @computed
    get shouldRenderPromo(): boolean {
        return this.isFirstRun || this.isNewUser;
    }

    @computed
    get renderNewsletter(): boolean {
        return this.shouldRenderPromo && this.showNewsletter && !this.marketingConsent;
    }

    @computed
    get renderOnboarding(): boolean {
        return this.showOnboarding && this.shouldRenderPromo;
    }

    @computed
    get renderUpgradeScreen(): boolean {
        return this.forceShowUpgradeScreen || (this.showUpgradeScreen && this.shouldRenderPromo);
    }

    @action setIsAuthenticated = (value: boolean): void => {
        this.authenticated = value;
    };

    @action setAuthenticatedStatusRetrieved = (value: boolean): void => {
        this.authenticatedStatusRetrieved = value;
    };

    @action deauthenticate = async (): Promise<void> => {
        this.authenticated = false;
        await messenger.deauthenticateUser();
    };

    @action setPolicyAgreement = async (value: boolean): Promise<void> => {
        await messenger.updateAuthCache(AuthCacheKey.PolicyAgreement, value);
        runInAction(() => {
            this.policyAgreement = value;
        });
    };

    @action setHelpUsImprove = async (value: boolean): Promise<void> => {
        await messenger.updateAuthCache(AuthCacheKey.HelpUsImprove, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action onPolicyAgreementReceived = async (): Promise<void> => {
        await messenger.setConsentData(this.policyAgreement, this.helpUsImprove);
    };

    /**
     * Handles updates to the authentication cache.
     *
     * @param field The field to update.
     * @param value The new value for the field.
     */
    @action handleAuthCacheUpdate = <T extends AuthCacheKey>(field: T, value: AuthCacheData[T]): void => {
        switch (field) {
            case AuthCacheKey.PolicyAgreement:
                this.policyAgreement = value as boolean;
                break;
            case AuthCacheKey.HelpUsImprove:
                this.helpUsImprove = value as boolean;
                break;
            case AuthCacheKey.WebAuthFlowState:
                this.webAuthFlowState = value as WebAuthState;
                break;
            default:
                break;
        }
    };

    /**
     * Starts the web authentication flow.
     */
    @action startWebAuthFlow = async (): Promise<void> => {
        this.requestProcessState = RequestStatus.Pending;
        await messenger.sendWebAuthAction(WebAuthAction.Start);
    };

    /**
     * Reopens the web authentication flow.
     */
    @action reopenWebAuthFlow = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.Reopen);
    };

    /**
     * Cancels the web authentication flow.
     */
    @action cancelWebAuthFlow = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.Cancel);
        runInAction(() => {
            this.requestProcessState = RequestStatus.Done;
        });
    };

    /**
     * Closes "Failed to login" modal in auth screen.
     */
    @action closeFailedToLoginModal = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.DismissFailure);
    };

    @action setRating = (value: number): void => {
        this.rating = value;
    };

    /**
     * Closes rate modal without rating.
     */
    @action closeRateModal = async (): Promise<void> => {
        await messenger.hideRateModalAfterCancel();
        runInAction(() => {
            this.showRateModal = false;
        });
    };

    /**
     * Closes rate modal and opens confirm rate modal.
     */
    @action openConfirmRateModal = (): void => {
        this.showRateModal = false;
        this.showConfirmRateModal = true;
    };

    /**
     * Closes confirm rate modal after rating.
     */
    @action closeConfirmRateModalAfterRate = async (): Promise<void> => {
        await messenger.hideRateModalAfterRate();
        runInAction(() => {
            this.showConfirmRateModal = false;
        });
    };

    /**
     * Closes confirm rate modal without rating.
     */
    @action closeConfirmRateModalAfterCancel = async (): Promise<void> => {
        await messenger.hideRateModalAfterCancel();
        runInAction(() => {
            this.showConfirmRateModal = false;
        });
    };

    /**
     * Sets new value for {@link showRateModal}.
     */
    @action setShouldShowRateModal = (value: boolean): void => {
        this.showRateModal = value;
    };

    @computed
    get shouldShowHintPopup(): boolean {
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

    @action setShowHintPopup = (value: boolean): void => {
        this.showHintPopup = value;
    };

    @action closeHintPopup = async (): Promise<void> => {
        await messenger.setHintPopupViewed();
        runInAction(() => {
            this.showHintPopup = false;
        });
    };

    @action setUsername = (username: string): void => {
        this.username = username;
    };
}
