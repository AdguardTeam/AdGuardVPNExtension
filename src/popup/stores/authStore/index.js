import {
    observable,
    action,
    runInAction,
    computed,
    toJS,
} from 'mobx';
import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from '../consts';
import messenger from '../../../lib/messenger';

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
    signInCheck: false,
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

    @observable signInCheck = false;

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
            username, password, step, signInCheck,
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
            if (signInCheck) {
                this.signInCheck = signInCheck;
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
            this.receivedAuthenticationInfo = true;
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
    openSocialAuth = async (social) => {
        await messenger.startSocialAuth(social);
        window.close();
    };

    @action
    switchStep = async (step) => {
        this.step = step;
        this.resetError();
        await messenger.updateAuthCache('step', step);
    };

    @action
    showCheckEmail = async () => {
        await this.switchStep(AUTH_STEPS.CHECK_EMAIL);
    };

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
}

export default AuthStore;
