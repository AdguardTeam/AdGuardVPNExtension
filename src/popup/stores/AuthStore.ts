import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';
import isNil from 'lodash/isNil';

import { messenger } from '../../common/messenger';
import { FLAGS_FIELDS, type SocialAuthProvider } from '../../common/constants';

import { RequestStatus } from './constants';
import type { RootStore } from './RootStore';

export enum CredentialsKey {
    MarketingConsent = 'marketingConsent',
}

interface CredentialsInterface {
    [CredentialsKey.MarketingConsent]: boolean | string;
}

const DEFAULTS = {
    credentials: {
        [CredentialsKey.MarketingConsent]: '',
    },
    authenticated: false,
    authenticatedStatusRetrieved: false,
    policyAgreement: false,
    helpUsImprove: false,
};

export class AuthStore {
    @observable credentials: CredentialsInterface = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable authenticatedStatusRetrieved = DEFAULTS.authenticatedStatusRetrieved;

    @observable policyAgreement = DEFAULTS.policyAgreement;

    @observable helpUsImprove = DEFAULTS.helpUsImprove;

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

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
    };

    @action getAuthCacheFromBackground = async () => {
        const {
            policyAgreement,
            helpUsImprove,
            marketingConsent,
        } = await messenger.getAuthCache();
        runInAction(() => {
            this.credentials = {
                ...this.credentials,
                marketingConsent,
            };
            if (!isNil(policyAgreement)) {
                this.policyAgreement = policyAgreement;
            }
            if (!isNil(helpUsImprove)) {
                this.helpUsImprove = helpUsImprove;
            }
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

    @action proceedAuthorization = async (provider: SocialAuthProvider) => {
        await this.openSocialAuth(provider);
    };

    @action openSocialAuth = async (provider: SocialAuthProvider) => {
        await messenger.startSocialAuth(provider, !!this.marketingConsent);
        window.close();
    };

    @action setPolicyAgreement = async (value: boolean) => {
        await messenger.updateAuthCache('policyAgreement', value);
        runInAction(() => {
            this.policyAgreement = value;
        });
    };

    @action setHelpUsImprove = async (value: boolean) => {
        await messenger.updateAuthCache('helpUsImprove', value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action onPolicyAgreementReceived = async () => {
        await messenger.setConsentData(this.policyAgreement, this.helpUsImprove);
    };

    @action setMarketingConsent = async (value: boolean) => {
        await messenger.updateAuthCache('marketingConsent', value);
        runInAction(() => {
            this.credentials.marketingConsent = value;
        });
    };

    @computed
    get marketingConsent() {
        return this.credentials.marketingConsent;
    }

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
