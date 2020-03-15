import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';
import debounce from 'lodash/debounce';
import browser from 'webextension-polyfill';
import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from '../consts';

const AUTH_STEPS = {
    CHECK_EMAIL: 'checkEmail',
    SIGN_IN: 'signIn',
    REGISTRATION: 'registration',
    TWO_FACTOR: 'twoFactor',
};

const DEFAULTS = {
    credentials: {
        username: '',
        password: '',
        passwordAgain: '',
        twoFactor: '',
    },
    authenticated: false,
    receivedAuthenticationInfo: false,
    need2fa: false,
    error: null,
    field: '',
    step: AUTH_STEPS.CHECK_EMAIL,
    agreement: true,
    marketingConsent: false,
};

// TODO [maximtop] add validation
class AuthStore {
    @observable credentials = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable receivedAuthenticationInfo = DEFAULTS.receivedAuthenticationInfo;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error = DEFAULTS.error;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    @observable requestProcessState = REQUEST_STATUSES.DONE;

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
    };

    @action
    resetError = () => {
        this.error = DEFAULTS.error;
    };

    validate = debounce((field, value) => {
        if (field === 'passwordAgain') {
            if (value !== this.credentials.password) {
                runInAction(() => {
                    this.error = browser.i18n.getMessage('registration_error_front_unique_validation');
                });
            }
        }
    }, 500);

    @action
    onCredentialsChange = (field, value) => {
        this.resetError();
        this.credentials[field] = value;
        this.validate(field, value);
        adguard.authCache.updateAuthCache(field, value);
    };

    @action
    getAuthCacheFromBackground = () => {
        const { username, password, step } = adguard.authCache.getAuthCache();
        runInAction(() => {
            this.credentials = {
                ...this.credentials,
                username,
                password,
            };
            if (step) {
                this.step = step;
            }
        });
    };

    @computed
    get disableRegister() {
        const { username, password, passwordAgain } = this.credentials;
        if (!username || !password || !passwordAgain) {
            return true;
        }
        if (password !== passwordAgain) {
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
        const response = await adguard.auth.authenticate(this.credentials);

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
            });
            return;
        }

        if (response.status === 'ok') {
            adguard.authCache.clearAuthCache();
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
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.DONE;
                this.need2fa = true;
                this.switchStep(this.STEPS.TWO_FACTOR);
            });
        }
    };

    @action
    checkEmail = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;

        // TODO [maximtop] make possible for userLookup to receive just email
        const appId = adguard.credentials.getAppId();
        const response = await adguard.auth.userLookup(this.credentials.username, appId);

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
            });
            return;
        }

        if (response.canRegister) {
            this.switchStep(this.STEPS.REGISTRATION);
        } else {
            this.switchStep(this.STEPS.SIGN_IN);
        }

        runInAction(() => {
            this.requestProcessState = REQUEST_STATUSES.DONE;
        });
    };

    @action
    register = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await adguard.auth.register(this.credentials);
        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
                this.field = response.field;
            });
            return;
        }
        if (response.status === 'ok') {
            adguard.authCache.clearAuthCache();
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
        const result = await adguard.auth.isAuthenticated();
        if (result) {
            runInAction(() => {
                this.authenticated = true;
            });
        }
        runInAction(() => {
            this.requestProcessState = REQUEST_STATUSES.DONE;
            this.receivedAuthenticationInfo = true;
        });
    };

    @action
    setIsAuthenticated = (value) => {
        this.authenticated = value;
    };

    @action
    deauthenticate = async () => {
        await adguard.auth.deauthenticate();
        await adguard.credentials.persistVpnToken(null);
        await this.rootStore.settingsStore.setProxyState(false);
        runInAction(() => {
            this.setDefaults();
        });
    };

    @action
    openSocialAuth = async (social) => {
        await adguard.auth.startSocialAuth(social);
        window.close();
    };

    @action
    switchStep = (step) => {
        this.step = step;
        this.resetError();
        adguard.authCache.updateAuthCache('step', step);
    };

    @action
    showRegistration = () => {
        this.switchStep(AUTH_STEPS.REGISTRATION);
    };

    @action
    showSignIn = () => {
        this.switchStep(AUTH_STEPS.SIGN_IN);
    };

    @action
    showCheckEmail = () => {
        this.switchStep(AUTH_STEPS.CHECK_EMAIL);
    };
}

export default AuthStore;
