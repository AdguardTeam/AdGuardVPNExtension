import { observable, action, runInAction } from 'mobx';
import bgProvider from '../../../lib/background-provider';

// TODO [maximtop] add validation
class AuthStore {
    @observable credentials = {
        username: '',
        password: '',
    };

    @observable authenticated = false;

    @observable need2fa = false;

    @observable error = false;

    @observable errorDescription;

    @action setCredentials(credentials) {
        this.credentials = credentials;
    }

    @action onCredentialsChange = (field, value) => {
        this.credentials[field] = value;
    };

    @action authenticate = async (credentials) => {
        const response = await bgProvider.auth.authenticate(credentials);

        if (response.error) {
            runInAction(() => {
                this.error = true;
                this.errorDescription = response.errorDescription;
                this.setCredentials(credentials);
            });
            return;
        }

        if (response.status === 'ok') {
            runInAction(() => {
                this.authenticated = true;
                this.credentials = {
                    username: '',
                    password: '',
                };
            });
            return;
        }

        if (response.status === 'need2fa') {
            this.setCredentials(credentials);
        }
    };

    // TODO [maximtop] remove method with test credentials
    @action fakeAuthenticate = async () => {
        await this.authenticate({
            username: 'maximtop@gmail.com',
            password: 'AijGrVhFxo7CWArv',
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
