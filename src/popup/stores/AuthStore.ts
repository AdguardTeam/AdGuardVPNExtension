import {
    observable,
    action,
    runInAction,
    computed,
    toJS,
} from 'mobx';
import isNil from 'lodash/isNil';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import { messenger } from '../../lib/messenger';
import { SETTINGS_IDS, FLAGS_FIELDS } from '../../lib/constants';
import { translator } from '../../common/translator';

const AUTH_STEPS = {
    POLICY_AGREEMENT: 'policyAgreement',
    AUTHORIZATION: 'authorization',
    CHECK_EMAIL: 'checkEmail',
    SIGN_IN: 'signIn',
    REGISTRATION: 'registration',
    TWO_FACTOR: 'twoFactor',
};

enum CredentialsKeys {
    Username = 'username',
    Password = 'password',
    ConfirmPassword = 'confirmPassword',
    TwoFactor = 'twoFactor',
    MarketingConsent = 'marketingConsent',
}

interface CredentialsInterface {
    [CredentialsKeys.Username]: string;
    [CredentialsKeys.Password]: string;
    [CredentialsKeys.ConfirmPassword]: string;
    [CredentialsKeys.TwoFactor]: string;
    [CredentialsKeys.MarketingConsent]: boolean | null;
}

const DEFAULTS = {
    credentials: {
        [CredentialsKeys.Username]: '',
        [CredentialsKeys.Password]: '',
        [CredentialsKeys.ConfirmPassword]: '',
        [CredentialsKeys.TwoFactor]: '',
        [CredentialsKeys.MarketingConsent]: null,
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
    @observable credentials: CredentialsInterface = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error: string | null = DEFAULTS.error;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    @observable policyAgreement = DEFAULTS.policyAgreement;

    @observable helpUsImprove = DEFAULTS.helpUsImprove;

    @observable requestProcessState = REQUEST_STATUSES.DONE;

    @observable signInCheck = DEFAULTS.signInCheck;

    @observable isNewUser: boolean;

    @observable isFirstRun: boolean;

    @observable isSocialAuth: boolean;

    @observable showOnboarding: boolean;

    @observable showUpgradeScreen: boolean;

    STEPS = AUTH_STEPS;

    rootStore: any;

    constructor(rootStore: any) {
        this.rootStore = rootStore;
    }

    @action setDefaults = () => {
        this.credentials = DEFAULTS.credentials;
        this.authenticated = DEFAULTS.authenticated;
        this.need2fa = DEFAULTS.need2fa;
        this.error = DEFAULTS.error;
        this.step = DEFAULTS.step;
        this.signInCheck = DEFAULTS.signInCheck;
    };

    @action resetError = async () => {
        await this.setError(DEFAULTS.error);
    };

    @action onCredentialsChange = async (field: string, value: string) => {
        await this.resetError();
        const key = <CredentialsKeys>field;

        runInAction(() => {
            // @ts-ignore
            this.credentials[key as keyof CredentialsInterface] = value;
        });
        await messenger.updateAuthCache(field, value);
    };

    @action getAuthCacheFromBackground = async () => {
        const {
            username,
            password,
            confirmPassword,
            step,
            signInCheck,
            policyAgreement,
            helpUsImprove,
            marketingConsent,
            authError,
        } = await messenger.getAuthCache();
        runInAction(() => {
            this.credentials = {
                ...this.credentials,
                username,
                password,
                confirmPassword,
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
            this.error = authError;
        });
    };

    @action setFlagsStorageData = (flagsStorageData: { [key: string]: boolean }) => {
        this.isNewUser = flagsStorageData[FLAGS_FIELDS.IS_NEW_USER];
        this.isSocialAuth = flagsStorageData[FLAGS_FIELDS.IS_SOCIAL_AUTH];
        this.showOnboarding = flagsStorageData[FLAGS_FIELDS.SHOW_ONBOARDING];
        this.showUpgradeScreen = flagsStorageData[FLAGS_FIELDS.SHOW_UPGRADE_SCREEN];
    };

    @action setShowOnboarding = async (value: boolean) => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_ONBOARDING, value);
        runInAction(() => {
            this.showOnboarding = value;
        });
    };

    @action setShowUpgradeScreen = async (value: boolean) => {
        await messenger.setFlag(FLAGS_FIELDS.SHOW_UPGRADE_SCREEN, value);
        runInAction(() => {
            this.showUpgradeScreen = value;
        });
    };

    @action setIsFirstRun = (value: boolean) => {
        this.isFirstRun = value;
    };

    @computed
    get disableRegister() {
        const { username, password, confirmPassword } = this.credentials;
        return !username || !password || !confirmPassword;
    }

    @computed
    get disableLogin() {
        const { username, password } = this.credentials;
        if (!username || !password) {
            return true;
        }
        return false;
    }

    // AG-10009 Newsletter subscription screen
    @computed
    get renderNewsletter() {
        return this.marketingConsent === null
            && ((this.isFirstRun && this.isSocialAuth)
                || (this.isNewUser && !this.isSocialAuth));
    }

    // AG-10009 Promo screens (onboarding and upgrade screen) should be shown
    // only on first run or for new users authenticated via mail
    @computed
    get shouldRenderPromo() {
        return this.isFirstRun || (this.isNewUser && !this.isSocialAuth);
    }

    @computed
    get renderOnboarding() {
        return this.showOnboarding && this.shouldRenderPromo;
    }

    @computed
    get renderUpgradeScreen() {
        return this.showUpgradeScreen && this.shouldRenderPromo;
    }

    @action authenticate = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await messenger.authenticateUser(toJS(this.credentials));

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
            });
            await this.setError(response.error);
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

    @action checkEmail = async () => {
        this.requestProcessState = REQUEST_STATUSES.PENDING;

        const response = await messenger.checkEmail(this.credentials.username);

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
            });
            await this.setError(response.error);
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

    @action register = async () => {
        if (this.credentials.password !== this.credentials.confirmPassword) {
            await this.setError(translator.getMessage('registration_error_confirm_password'));
            return;
        }
        this.requestProcessState = REQUEST_STATUSES.PENDING;
        const response = await messenger.registerUser(toJS(this.credentials));
        if (response.error) {
            runInAction(() => {
                this.requestProcessState = REQUEST_STATUSES.ERROR;
                this.field = response.field;
                if (response.field === 'username') {
                    this.switchStep(this.STEPS.CHECK_EMAIL, false);
                    this.resetPasswords();
                }
            });
            await this.setError(response.error);
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

    @action isAuthenticated = async () => {
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

    @action setIsAuthenticated = (value: boolean) => {
        this.authenticated = value;
    };

    @action deauthenticate = async () => {
        this.setDefaults();
        await messenger.deauthenticateUser();
    };

    @action proceedAuthorization = async (provider: string) => {
        await this.openSocialAuth(provider);
    };

    @action openSocialAuth = async (social: string) => {
        await messenger.startSocialAuth(social, this.marketingConsent);
        window.close();
    };

    @action switchStep = async (step: string, shouldResetErrors: boolean = true) => {
        this.step = step;
        if (shouldResetErrors) {
            await this.resetError();
        }
        await messenger.updateAuthCache('step', step);
    };

    @action showAuthorizationScreen = async () => {
        await this.switchStep(this.STEPS.AUTHORIZATION);
    };

    @action resetPasswords = async () => {
        await messenger.updateAuthCache('password', DEFAULTS.credentials.password);
        await messenger.updateAuthCache('confirmPassword', DEFAULTS.credentials.confirmPassword);
        await messenger.updateAuthCache('twoFactor', DEFAULTS.credentials.twoFactor);
        runInAction(() => {
            this.credentials.password = DEFAULTS.credentials.password;
            this.credentials.confirmPassword = DEFAULTS.credentials.confirmPassword;
            this.credentials.twoFactor = DEFAULTS.credentials.twoFactor;
        });
    };

    @action openSignInCheck = async () => {
        await messenger.updateAuthCache('signInCheck', true);

        runInAction(() => {
            this.signInCheck = true;
        });
    };

    @action openSignUpCheck = async () => {
        await messenger.updateAuthCache('signInCheck', false);

        runInAction(() => {
            this.signInCheck = false;
        });
    };

    @action setPolicyAgreement = async (value: boolean) => {
        await messenger.updateAuthCache('policyAgreement', value);
        runInAction(() => {
            this.policyAgreement = value;
        });
    };

    @action handleInitPolicyAgreement = async (policyAgreement: boolean) => {
        if (!policyAgreement) {
            await this.switchStep(AUTH_STEPS.POLICY_AGREEMENT);
        }
    };

    @action setHelpUsImprove = async (value: boolean) => {
        await messenger.updateAuthCache('helpUsImprove', value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action onPolicyAgreementReceived = async () => {
        await messenger.setSetting(SETTINGS_IDS.POLICY_AGREEMENT, this.policyAgreement);
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, this.helpUsImprove);
        await this.showAuthorizationScreen();
    };

    @action setMarketingConsent = async (value: boolean | null) => {
        await messenger.updateAuthCache('marketingConsent', value);
        runInAction(() => {
            this.credentials.marketingConsent = value;
        });
    };

    @action setError = async (value: string | null) => {
        await messenger.updateAuthCache('authError', value);
        runInAction(() => {
            this.error = value;
        });
    };

    @computed
    get marketingConsent() {
        return this.credentials.marketingConsent;
    }
}
