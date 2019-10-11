import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';
import debounce from 'lodash/debounce';
import browser from 'webextension-polyfill';
import { REQUEST_STATUSES } from '../consts';

import bgProvider from '../../../lib/background-provider';

const AUTH_STEPS = {
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
    step: AUTH_STEPS.SIGN_IN,
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

    @observable state = REQUEST_STATUSES.PENDING;

    STEPS = AUTH_STEPS;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.step = DEFAULTS.step;
    };

    @action resetError = () => {
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

    @action onCredentialsChange = (field, value) => {
        this.resetError();
        this.credentials[field] = value;
        this.validate(field, value);
        bgProvider.authCache.updateAuthCache(field, value);
    };

    @action
    getAuthCacheFromBackground = async () => {
        const { username, password, step } = await bgProvider.authCache.getAuthCache();
        runInAction(() => {
            this.credentials = { ...this.credentials, username, password };
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

    @action authenticate = async () => {
        this.state = REQUEST_STATUSES.PENDING;
        const response = await bgProvider.auth.authenticate(this.credentials);

        if (response.error) {
            runInAction(() => {
                this.state = REQUEST_STATUSES.ERROR;
                this.error = response.error;
            });
            return;
        }

        if (response.status === 'ok') {
            bgProvider.authCache.clearAuthCache();
            runInAction(() => {
                this.state = REQUEST_STATUSES.DONE;
                this.authenticated = true;
                this.need2fa = false;
                this.credentials = DEFAULTS.credentials;
            });
            return;
        }

        if (response.status === '2fa_required') {
            runInAction(() => {
                this.state = REQUEST_STATUSES.DONE;
                this.need2fa = true;
                this.switchStep(this.STEPS.TWO_FACTOR);
            });
        }
    };

    @action register = async () => {
        this.state = REQUEST_STATUSES.PENDING;
        const response = await bgProvider.auth.register(this.credentials);
        if (response.error) {
            runInAction(() => {
                this.state = REQUEST_STATUSES.ERROR;
                this.error = response.error;
                this.field = response.field;
            });
            return;
        }
        if (response.status === 'ok') {
            runInAction(() => {
                this.state = REQUEST_STATUSES.DONE;
                this.authenticated = true;
                this.credentials = DEFAULTS.credentials;
            });
        }
    };

    @action isAuthenticated = async () => {
        this.state = REQUEST_STATUSES.PENDING;
        const result = await bgProvider.auth.isAuthenticated();
        if (result) {
            runInAction(() => {
                this.authenticated = true;
            });
        }
        runInAction(() => {
            this.state = REQUEST_STATUSES.DONE;
            this.receivedAuthenticationInfo = true;
        });
    };

    @action deauthenticate = async () => {
        await bgProvider.auth.deauthenticate();
        await this.rootStore.settingsStore.setGlobalProxyEnabled(false);
        runInAction(() => {
            this.setDefaults();
        });
    };

    @action openSocialAuth = async (social) => {
        await bgProvider.auth.startSocialAuth(social);
        await bgProvider.tabs.closePopup();
    };

    @action switchStep = (step) => {
        this.step = step;
        this.resetError();
        bgProvider.authCache.updateAuthCache('step', step);
    };

    @action showRegistration = () => {
        this.switchStep(AUTH_STEPS.REGISTRATION);
    };

    @action showSignIn = () => {
        this.switchStep(AUTH_STEPS.SIGN_IN);
    };
}

export default AuthStore;
