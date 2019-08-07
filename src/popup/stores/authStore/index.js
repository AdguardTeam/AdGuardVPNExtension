import { observable, action, runInAction } from 'mobx';
import bgProvider from '../../../lib/background-provider';

// TODO [maximtop] add validation
class AuthStore {
    @observable credentials = {
        username: '',
        password: '',
        twoFA: '',
    };

    @observable authenticated = false;

    @observable need2fa = false;

    @observable error = false;

    @observable errorDescription;

    updateCredentials = (credentials) => {
        const { password, username, twoFA } = credentials;
        const updatedCredentials = {};

        updatedCredentials.password = password || '';
        updatedCredentials.username = username || '';
        updatedCredentials.twoFA = twoFA || '';

        return updatedCredentials;
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
                this.credentials = this.updateCredentials();
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
    }
}

const authStore = new AuthStore();
export default authStore;
