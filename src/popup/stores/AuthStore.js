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
import { SETTINGS_IDS, AUTH_PROVIDERS, USER_STATE_KEYS } from '../../lib/constants';

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
        marketingConsent: null,
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

    @observable isFirstRun;

    @observable isSocialAuth;

    @observable showOnboarding;

    @observable showUpgradeScreen;

    @observable promoScreenState;

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
        });
    };

    @action
    updateUserState = async () => {
        const userState = await messenger.getUserState();
        runInAction(() => {
            this.isNewUser = userState[USER_STATE_KEYS.IS_NEW_USER];
            this.isSocialAuth = userState[USER_STATE_KEYS.IS_SOCIAL_AUTH];
            this.showOnboarding = userState[USER_STATE_KEYS.SHOW_ONBOARDING];
            this.showUpgradeScreen = userState[USER_STATE_KEYS.SHOW_UPGRADE_SCREEN];
            this.promoScreenState = userState[USER_STATE_KEYS.SALE_SHOW];
        });
    }

    @action
    setShowOnboarding = async (value) => {
        await messenger.setUserState(USER_STATE_KEYS.SHOW_ONBOARDING, value);
        runInAction(() => {
            this.showOnboarding = value;
        });
    };

    @action
    setShowUpgradeScreen = async (value) => {
        await messenger.setUserState(USER_STATE_KEYS.SHOW_UPGRADE_SCREEN, value);
        runInAction(() => {
            this.showUpgradeScreen = value;
        });
    };

    @action
    setSalePromoStatus = async (state) => {
        await messenger.setUserState(USER_STATE_KEYS.SALE_SHOW, state);
        runInAction(() => {
            this.promoScreenState = state;
        });
    }

    @action
    updateIsFirstRun = async () => {
        const isFirstRun = await messenger.getIsFirstRun();
        runInAction(() => {
            this.isFirstRun = isFirstRun;
        });
    }

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
}
