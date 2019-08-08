import {
    observable, action, runInAction,
} from 'mobx';
import bgProvider from '../../../lib/background-provider';

const DEFAULTS = {
    credentials: {
        username: '',
        password: '',
        twoFA: '',
    },
    authenticated: false,
    need2fa: false,
    error: false,
    errorDescription: '',
};

// TODO [maximtop] add validation
class AuthStore {
    @observable credentials = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error = DEFAULTS.error;

    @observable errorDescription = DEFAULTS.errorDescription;

    setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.errorDescription = DEFAULTS.errorDescription;
    };

    @action onCredentialsChange = (field, value) => {
        this.credentials[field] = value;
    };

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
}

const authStore = new AuthStore();
export default authStore;
