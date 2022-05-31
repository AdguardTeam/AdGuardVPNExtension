import {
    observable,
    action,
    runInAction,
    computed,
    toJS,
} from 'mobx';
import debounce from 'lodash/debounce';

import { REQUEST_STATUSES } from './consts';
import { messenger } from '../../lib/messenger';
import { reactTranslator } from '../../common/reactTranslator';

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
    error: null,
    field: '',
    step: AUTH_STEPS.SIGN_IN,
    agreement: true,
    marketingConsent: false,
};

export class AuthStore {
    @observable credentials = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error = DEFAULTS.error;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    @observable requestProcessState = REQUEST_STATUSES.DONE;

    @observable maxDevicesCount = 0;

    @observable subscriptionType = null;

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

    @action setPasswordAgainError = () => {
        this.error = reactTranslator.getMessage('registration_error_front_unique_validation');
        this.field = 'passwordAgain';
    };

    validate = debounce((field, value) => {
        if (field === 'passwordAgain') {
            if (value !== this.credentials.password) {
                this.setPasswordAgainError();
            }
        }
        if (field === 'password') {
            if (this.credentials.password !== this.credentials.passwordAgain
                && this.credentials.passwordAgain.length > 0) {
                this.setPasswordAgainError();
            }
        }
    }, 500);

    @action onCredentialsChange = async (field, value) => {
        this.resetError();
        this.credentials[field] = value;
        this.validate(field, value);
        await messenger.updateAuthCache(field, value);
    };

    @action getAuthCacheFromBackground = async () => {
        const {
            username,
            password,
            step,
        } = await messenger.getAuthCache();
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
        const {
            username,
            password,
            passwordAgain,
        } = this.credentials;
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
        const {
            username,
            password,
        } = this.credentials;
        if (!username || !password) {
            return true;
        }
        return false;
    }

    @action authenticate = async () => {
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
            await this.rootStore.globalStore.getOptionsData();
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

    @action register = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await messenger.registerUser(this.credentials);
        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.error = response.error;
                this.field = response.field;
            });
            return;
        }
        if (response.status === 'ok') {
            await messenger.clearAuthCache();
            await this.rootStore.globalStore.getOptionsData();
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.DONE;
                this.authenticated = true;
                this.credentials = DEFAULTS.credentials;
            });
        }
    };

    @action setIsAuthenticated = (value) => {
        this.authenticated = value;
    };

    @action setSubscriptionType = (subscriptionType) => {
        this.subscriptionType = subscriptionType;
    };

    @action deauthenticate = async () => {
        await messenger.deauthenticateUser();
        await this.rootStore.settingsStore.disableProxy();
        runInAction(() => {
            this.setDefaults();
        });
    };

    @action openSocialAuth = async (social) => {
        await messenger.startSocialAuth(social);
    };

    @action switchStep = async (step) => {
        this.step = step;
        this.resetError();
        await messenger.updateAuthCache('step', step);
    };

    @action showRegistration = async () => {
        await this.switchStep(AUTH_STEPS.REGISTRATION);
    };

    @action showSignIn = async () => {
        await this.switchStep(AUTH_STEPS.SIGN_IN);
        runInAction(() => {
            // clear two factor field
            // issue AG-2070
            this.credentials.twoFactor = DEFAULTS.credentials.twoFactor;
        });
    };

    @action setMaxDevicesCount = (value) => {
        this.maxDevicesCount = value;
    };
}
