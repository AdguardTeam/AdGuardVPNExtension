import {
    observable,
    action,
    runInAction,
    computed,
    toJS,
} from 'mobx';
import isNil from 'lodash/isNil';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import messenger from '../../lib/messenger';
import { SETTINGS_IDS, AUTH_PROVIDERS } from '../../lib/constants';

const AUTH_STEPS = {
    POLICY_AGREEMENT: 'policyAgreement',
    AUTHORIZATION: 'authorization',
    CHECK_EMAIL: 'checkEmail',
    SIGN_IN: 'signIn',
    REGISTRATION: 'registration',
    TWO_FACTOR: 'twoFactor',
};

const DEFAULTS = {
    credentials: {
        username: '',
        password: '',
        twoFactor: '',
        marketingConsent: false,
    },
    authenticated: false,
    need2fa: false,
    error: null,
    field: '',
    step: AUTH_STEPS.AUTHORIZATION,
    agreement: true,
    policyAgreement: false,
    helpUsImprove: false,
    signInCheck: false,
    showOnboarding: true,
    showUpgradeScreen: true,
};

export class AuthStore {
    @observable credentials = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error = DEFAULTS.error;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    @observable policyAgreement = DEFAULTS.policyAgreement;

    @observable helpUsImprove = DEFAULTS.helpUsImprove;

    @observable requestProcessState = REQUEST_STATUSES.DONE;

    @observable signInCheck = DEFAULTS.signInCheck;

    @observable isNewUser;

    @observable isSocialAuth;

    @observable showOnboarding = DEFAULTS.showOnboarding;

    @observable showUpgradeScreen = DEFAULTS.showUpgradeScreen;

    STEPS = AUTH_STEPS;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.step = DEFAULTS.step;
        this.signInCheck = DEFAULTS.signInCheck;
        this.showOnboarding = DEFAULTS.showOnboarding;
        this.showUpgradeScreen = DEFAULTS.showUpgradeScreen;
    };

    @action
    resetError = () => {
        this.error = DEFAULTS.error;
    };

    @action
    onCredentialsChange = async (field, value) => {
        this.resetError();
        this.credentials[field] = value;
        await messenger.updateAuthCache(field, value);
    };

    @action
    getAuthCacheFromBackground = async () => {
        const {
            username,
            password,
            step,
            signInCheck,
            policyAgreement,
            helpUsImprove,
            marketingConsent,
            showOnboarding,
            showUpgradeScreen,
        } = await messenger.getAuthCache();
        runInAction(() => {
            this.credentials = {
                ...this.credentials,
                username,
                password,
                marketingConsent,
            };
            if (step) {
                this.step = step;
            }
            if (signInCheck) {
                this.signInCheck = signInCheck;
            }
            if (!isNil(policyAgreement)) {
                this.policyAgreement = policyAgreement;
            }
            if (!isNil(helpUsImprove)) {
                this.helpUsImprove = helpUsImprove;
            }
            if (!isNil(showOnboarding)) {
                this.showOnboarding = showOnboarding;
            }
            if (!isNil(showUpgradeScreen)) {
                this.showUpgradeScreen = showUpgradeScreen;
            }
        });
    };

    @computed
    get disableRegister() {
        const { username, password } = this.credentials;
        if (!username || !password) {
            return true;
        }
        return false;
    }

    @computed
    get disableLogin() {
        const { username, password } = this.credentials;
        if (!username || !password) {
            return true;
        }
        return false;
    }

    @action
    authenticate = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await messenger.authenticateUser(toJS(this.credentials));

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
            });
            return;
        }

        if (response.status === 'ok') {
            await messenger.clearAuthCache();
            await messenger.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.DONE;
                this.authenticated = true;
                this.need2fa = false;
                this.credentials = DEFAULTS.credentials;
            });
            return;
        }

        if (response.status === '2fa_required') {
            runInAction(async () => {
                this.requestProcessState = REQUEST_STATUSES.DONE;
                this.need2fa = true;
                await this.switchStep(this.STEPS.TWO_FACTOR);
            });
        }
    };

    @action
    checkEmail = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;

        const response = await messenger.checkEmail(this.credentials.username);

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
            });
            return;
        }

        if (response.canRegister) {
            await this.switchStep(this.STEPS.REGISTRATION);
        } else {
            await this.switchStep(this.STEPS.SIGN_IN);
        }

        runInAction(() => {
            this.requestProcessState = REQUEST_STATUSES.DONE;
        });
    };

    @action
    register = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await messenger.registerUser(toJS(this.credentials));
        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
                this.field = response.field;
                if (response.field === 'username') {
                    this.switchStep(this.STEPS.CHECK_EMAIL, false);
                    this.resetPasswords();
                }
            });
            return;
        }
        if (response.status === 'ok') {
            await messenger.clearAuthCache();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.DONE;
                this.authenticated = true;
                this.credentials = DEFAULTS.credentials;
            });
        }
    };

    @action
    isAuthenticated = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const result = await messenger.isAuthenticated();
        if (result) {
            runInAction(() => {
                this.authenticated = true;
            });
        }
        runInAction(() => {
            this.requestProcessState = REQUEST_STATUSES.DONE;
        });
    };

    @action
    setIsAuthenticated = (value) => {
        this.authenticated = value;
    };

    @action
    deauthenticate = async () => {
        this.setDefaults();
        await messenger.deauthenticateUser();
    };

    @action
    proceedAuthorization = async (provider) => {
        if (provider === AUTH_PROVIDERS.ADGUARD) {
            await this.openSignUpCheck();
            await this.switchStep(this.STEPS.CHECK_EMAIL);
        } else {
            await this.openSocialAuth(provider);
        }
    };

    @action
    openSocialAuth = async (social) => {
        await messenger.startSocialAuth(social, this.marketingConsent);
        window.close();
    };

    @action
    switchStep = async (step, shouldResetErrors = true) => {
        this.step = step;
        if (shouldResetErrors) {
            this.resetError();
        }
        await messenger.updateAuthCache('step', step);
    };

    @action
    showAuthorizationScreen = async () => {
        await this.switchStep(this.STEPS.AUTHORIZATION);
    }

    @action
    resetPasswords = async () => {
        await messenger.updateAuthCache('password', DEFAULTS.credentials.password);
        await messenger.updateAuthCache('twoFactor', DEFAULTS.credentials.twoFactor);
        runInAction(() => {
            this.credentials.password = DEFAULTS.credentials.password;
            this.credentials.twoFactor = DEFAULTS.credentials.twoFactor;
        });
    }

    @action
    openSignInCheck = async () => {
        await messenger.updateAuthCache('signInCheck', true);

        runInAction(() => {
            this.signInCheck = true;
        });
    }

    @action
    openSignUpCheck = async () => {
        await messenger.updateAuthCache('signInCheck', false);

        runInAction(() => {
            this.signInCheck = false;
        });
    }

    @action
    setPolicyAgreement = async (value) => {
        await messenger.updateAuthCache('policyAgreement', value);
        runInAction(() => {
            this.policyAgreement = value;
        });
    };

    @action
    handleInitPolicyAgreement = async (policyAgreement) => {
        if (!policyAgreement) {
            await this.switchStep(AUTH_STEPS.POLICY_AGREEMENT);
        }
    };

    @action
    setHelpUsImprove = async (value) => {
        await messenger.updateAuthCache('helpUsImprove', value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    }

    @action
    onPolicyAgreementReceived = async () => {
        await messenger.setSetting(SETTINGS_IDS.POLICY_AGREEMENT, this.policyAgreement);
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, this.helpUsImprove);
        await this.showAuthorizationScreen();
    };

    @action
    setMarketingConsent = async (value) => {
        await messenger.updateAuthCache('marketingConsent', value);
        runInAction(() => {
            this.credentials.marketingConsent = value;
        });
    };

    @computed
    get marketingConsent() {
        return this.credentials.marketingConsent;
    }

    @action
    updateAuthInfo = async () => {
        const isNewUser = await messenger.getSetting(SETTINGS_IDS.IS_NEW_USER);
        const isSocialAuth = await messenger.getSetting(SETTINGS_IDS.IS_SOCIAL_AUTH);
        runInAction(() => {
            this.isNewUser = isNewUser;
            this.isSocialAuth = isSocialAuth;
        });
    };

    @action
    setShowOnboarding = async (value) => {
        await messenger.updateAuthCache('showOnboarding', value);
        runInAction(() => {
            this.showOnboarding = value;
        });
    };

    @action
    setShowUpgradeScreen = async (value) => {
        await messenger.updateAuthCache('showUpgradeScreen', value);
        runInAction(() => {
            this.showUpgradeScreen = value;
        });
    };
}
