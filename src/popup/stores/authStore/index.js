import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';
import debounce from 'lodash/debounce';
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
    need2fa: false,
    error: false,
    errorDescription: '',
    field: '',
    step: AUTH_STEPS.SIGN_IN,
    agreement: true,
    marketingConsent: false,
};

// TODO [maximtop] add validation
class AuthStore {
    @observable credentials = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error = DEFAULTS.error;

    @observable errorDescription = DEFAULTS.errorDescription;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    @observable state = REQUEST_STATUSES.DONE;

    STEPS = AUTH_STEPS;

    @action setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.errorDescription = DEFAULTS.errorDescription;
        this.step = DEFAULTS.step;
    };

    @action resetError = () => {
        this.error = DEFAULTS.error;
        this.errorDescription = DEFAULTS.errorDescription;
    };

    validate = debounce((field, value) => {
        if (field === 'passwordAgain') {
            if (value !== this.credentials.password) {
                runInAction(() => {
                    this.error = true;
                    this.errorDescription = 'Password and confirm password does not match';
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
                this.error = true;
                this.errorDescription = response.errorDescription;
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
                this.error = true;
                this.errorDescription = response.errorDescription;
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
        const result = await bgProvider.auth.isAuthenticated();
        if (result) {
            runInAction(() => {
                this.authenticated = true;
            });
        }
    };

    @action deauthenticate = async () => {
        await bgProvider.auth.deauthenticate();
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
