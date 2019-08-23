import {
    observable,
    action,
    runInAction,
    computed,
} from 'mobx';
import debounce from 'lodash/debounce';

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
        password_again: '',
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

    STEPS = AUTH_STEPS;

    @action setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.errorDescription = DEFAULTS.errorDescription;
        this.step = DEFAULTS.step;
    };

    @action setDefaultsError = () => {
        this.error = DEFAULTS.error;
        this.errorDescription = DEFAULTS.errorDescription;
    };

    validate = debounce((field, value) => {
        if (field === 'password_again') {
            if (value !== this.credentials.password) {
                runInAction(() => {
                    this.error = true;
                    this.errorDescription = 'Password and confirm password does not match';
                });
            }
        }
    }, 500);

    @action onCredentialsChange = (field, value) => {
        this.setDefaultsError();
        this.credentials[field] = value;
        this.validate(field, value);
    };

    @computed
    get canAuthenticate() {
        return this.credentials.password === this.credentials.password_again;
    }

    @action authenticate = async () => {
        const response = await bgProvider.auth.authenticate(this.credentials);

        if (response.error) {
            runInAction(() => {
                this.error = true;
                this.errorDescription = response.errorDescription;
            });
            return;
        }

        if (response.status === 'ok') {
            runInAction(() => {
                this.authenticated = true;
                this.need2fa = false;
                this.credentials = DEFAULTS.credentials;
            });
            return;
        }

        if (response.status === '2fa_required') {
            runInAction(() => {
                this.need2fa = true;
                this.switchStep(this.STEPS.TWO_FACTOR);
            });
        }
    };

    @action register = async () => {
        const response = await bgProvider.auth.register(this.credentials);
        if (response.error) {
            runInAction(() => {
                this.error = true;
                this.errorDescription = response.errorDescription;
                this.field = response.field;
            });
            return;
        }
        if (response.status === 'ok') {
            runInAction(() => {
                this.authenticated = true;
                this.credentials = DEFAULTS.credentials;
            });
        }
    };

    // TODO [maximtop] remove method with test credentials
    @action fakeAuthenticate = async () => {
        runInAction(async () => {
            this.credentials = {
                username: 'maximtop@gmail.com',
                password: 'AijGrVhFxo7CWArv',
            };
            await this.authenticate();
        });
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
        this.setDefaultsError();
    };

    @action showRegistration = () => {
        this.switchStep(AUTH_STEPS.REGISTRATION);
    };

    @action showSignIn = () => {
        this.switchStep(AUTH_STEPS.SIGN_IN);
    };
}

export default AuthStore;
