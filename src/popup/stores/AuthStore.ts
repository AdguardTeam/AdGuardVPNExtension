import {
    observable,
    action,
    runInAction,
    computed,
    toJS,
} from 'mobx';
import isNil from 'lodash/isNil';

import { MAX_GET_POPUP_DATA_ATTEMPTS, RequestStatus } from './constants';
import { messenger } from '../../lib/messenger';
import { SETTINGS_IDS, FLAGS_FIELDS, SocialAuthProvider } from '../../lib/constants';
import { translator } from '../../common/translator';
import {
    BAD_CREDENTIALS_CODE,
    REQUIRED_2FA_CODE,
    REQUIRED_EMAIL_CONFIRMATION_CODE,
    RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC,
} from '../../common/constants';

import type { RootStore } from './RootStore';

const AUTH_STEPS = {
    POLICY_AGREEMENT: 'policyAgreement',
    SCREENSHOT: 'screenshot',
    AUTHORIZATION: 'authorization',
    CHECK_EMAIL: 'checkEmail',
    SIGN_IN: 'signIn',
    REGISTRATION: 'registration',
    TWO_FACTOR: 'twoFactor',
    CONFIRM_EMAIL: 'confirmEmail',
};

enum CredentialsKey {
    Username = 'username',
    Password = 'password',
    ConfirmPassword = 'confirmPassword',
    TwoFactor = 'twoFactor',
    MarketingConsent = 'marketingConsent',
    Code = 'code',
}

interface CredentialsInterface {
    [CredentialsKey.Username]: string;
    [CredentialsKey.Password]: string;
    [CredentialsKey.ConfirmPassword]: string;
    [CredentialsKey.TwoFactor]: string;
    [CredentialsKey.MarketingConsent]: boolean | string;
    [CredentialsKey.Code]: string;
}

const DEFAULTS = {
    credentials: {
        [CredentialsKey.Username]: '',
        [CredentialsKey.Password]: '',
        [CredentialsKey.ConfirmPassword]: '',
        [CredentialsKey.TwoFactor]: '',
        [CredentialsKey.MarketingConsent]: '',
        [CredentialsKey.Code]: '',
    },
    authenticated: false,
    need2fa: false,
    error: null,
    field: '',
    step: AUTH_STEPS.AUTHORIZATION,
    prevSteps: [],
    agreement: true,
    policyAgreement: false,
    helpUsImprove: false,
    signInCheck: false,
    showOnboarding: true,
    showUpgradeScreen: true,
    resendCodeCountDown: RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC,
};

export class AuthStore {
    @observable credentials: CredentialsInterface = DEFAULTS.credentials;

    @observable authenticated = DEFAULTS.authenticated;

    @observable need2fa = DEFAULTS.need2fa;

    @observable error: string | null = DEFAULTS.error;

    @observable field = DEFAULTS.field;

    @observable step = DEFAULTS.step;

    /**
     * Needed for BackButton to navigate properly.
     */
    @observable prevSteps: string[] = DEFAULTS.prevSteps;

    @observable policyAgreement = DEFAULTS.policyAgreement;

    @observable helpUsImprove = DEFAULTS.helpUsImprove;

    @observable requestProcessState = RequestStatus.Done;

    @observable signInCheck = DEFAULTS.signInCheck;

    @observable isNewUser: boolean;

    @observable isFirstRun: boolean;

    @observable isSocialAuth: boolean;

    @observable showOnboarding: boolean;

    @observable showUpgradeScreen: boolean;

    @observable showRateModal = false;

    @observable showConfirmRateModal = false;

    @observable rating = 0;

    @observable userEmail = '';

    @observable confirmEmailTimer?: ReturnType<typeof setInterval>;

    @observable resendCodeCountDown = DEFAULTS.resendCodeCountDown;

    @observable showHintPopup = false;

    @observable showScreenshotFlow = false;

    STEPS = AUTH_STEPS;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
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
        const key = <CredentialsKey>field;

        runInAction(() => {
            this.credentials[key] = value;
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
        this.showRateModal = flagsStorageData[FLAGS_FIELDS.SHOULD_SHOW_RATE_MODAL];
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
        this.requestProcessState = RequestStatus.Pending;
        const response = await messenger.authenticateUser(toJS(this.credentials));

        if (response.error) {
            // user may enter a wrong password but during email confirmation
            // the password is to be checked after the valid code is entered.
            // so 'bad_credentials' may appear on email confirmation step
            // and it should be handled properly
            if (response.status === BAD_CREDENTIALS_CODE
                && this.step === this.STEPS.CONFIRM_EMAIL) {
                // redirect user to password step
                this.switchStep(this.STEPS.SIGN_IN, false);
            }

            runInAction(() => {
                this.requestProcessState = RequestStatus.Error;
            });
            await this.setError(response.error);
            return;
        }

        if (response.status === 'ok') {
            await messenger.clearAuthCache();
            await messenger.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
            runInAction(() => {
                this.requestProcessState = RequestStatus.Done;
                this.authenticated = true;
                this.need2fa = false;
                this.credentials = DEFAULTS.credentials;
            });
            return;
        }

        if (response.status === REQUIRED_2FA_CODE) {
            runInAction(async () => {
                this.requestProcessState = RequestStatus.Done;
                this.need2fa = true;
                this.prevSteps.push(this.step);
                await this.switchStep(this.STEPS.TWO_FACTOR);
            });
        }

        // handle email confirmation requirement
        if (response.status === REQUIRED_EMAIL_CONFIRMATION_CODE) {
            if (!response.authId) {
                runInAction(() => {
                    this.requestProcessState = RequestStatus.Error;
                });
                await this.setError('No authId in response');
                return;
            }

            this.getResendCodeCountDown();
            await messenger.setEmailConfirmationAuthId(response.authId);

            runInAction(async () => {
                this.requestProcessState = RequestStatus.Done;
                this.prevSteps.push(this.step);
                await this.switchStep(this.STEPS.CONFIRM_EMAIL);
            });
        }
    };

    @action checkEmail = async () => {
        this.requestProcessState = RequestStatus.Pending;

        const response = await messenger.checkEmail(this.credentials.username);

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = RequestStatus.Error;
            });
            await this.setError(response.error);
            return;
        }

        // before switching step save the current one to be able to return to it back
        this.prevSteps.push(this.step);

        if (response.canRegister) {
            await this.switchStep(this.STEPS.REGISTRATION);
        } else {
            await this.switchStep(this.STEPS.SIGN_IN);
        }

        runInAction(() => {
            this.requestProcessState = RequestStatus.Done;
        });
    };

    @action register = async () => {
        if (this.credentials.password !== this.credentials.confirmPassword) {
            await this.setError(translator.getMessage('registration_error_confirm_password'));
            return;
        }

        this.requestProcessState = RequestStatus.Pending;
        const response = await messenger.registerUser(toJS(this.credentials));

        if (response.error) {
            runInAction(() => {
                this.requestProcessState = RequestStatus.Error;
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
                this.requestProcessState = RequestStatus.Done;
                this.authenticated = true;
                this.credentials = DEFAULTS.credentials;
            });
        }

        if (response.status === REQUIRED_EMAIL_CONFIRMATION_CODE) {
            runInAction(async () => {
                this.requestProcessState = RequestStatus.Done;
                await this.switchStep(this.STEPS.CONFIRM_EMAIL);
            });
        }
    };

    @action isAuthenticated = async () => {
        this.requestProcessState = RequestStatus.Pending;
        const result = await messenger.isAuthenticated();
        if (result) {
            runInAction(() => {
                this.authenticated = true;
            });
        }
        runInAction(() => {
            this.requestProcessState = RequestStatus.Done;
        });
    };

    @action setIsAuthenticated = (value: boolean) => {
        this.authenticated = value;
    };

    @action setShowScreenshotFlow = (value: boolean) => {
        this.showScreenshotFlow = value;
    };

    @action deauthenticate = async () => {
        this.setDefaults();
        await messenger.deauthenticateUser();
    };

    @action proceedAuthorization = async (provider: SocialAuthProvider) => {
        await this.openSocialAuth(provider);
    };

    @action openSocialAuth = async (provider: SocialAuthProvider) => {
        await messenger.startSocialAuth(provider, !!this.marketingConsent);
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
        this.requestProcessState = RequestStatus.Done;
    };

    @action showScreenShotScreen = async () => {
        await this.switchStep(this.STEPS.SCREENSHOT);
    };

    @action handleScreenshotClick = async () => {
        // TODO: collect statistic
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

    @action resetCode = async () => {
        await messenger.updateAuthCache('code', DEFAULTS.credentials.code);
        runInAction(() => {
            this.credentials.code = DEFAULTS.credentials.code;
        });
    };

    @action resetRequestProcessionState = () => {
        this.requestProcessState = RequestStatus.Done;
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

        if (this.showScreenshotFlow) {
            await this.showScreenShotScreen();
            return;
        }

        await this.showAuthorizationScreen();
    };

    @action setMarketingConsent = async (value: boolean) => {
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

    @computed
    get username() {
        return this.credentials.username;
    }

    @action setRating = (value: number) => {
        this.rating = value;
    };

    @action closeRateModal = async () => {
        await messenger.setRateModalViewed();
        runInAction(() => {
            this.showRateModal = false;
        });
    };

    @action openConfirmRateModal = () => {
        this.showConfirmRateModal = true;
    };

    @action closeConfirmRateModal = async () => {
        await messenger.setRateModalViewed();
        runInAction(() => {
            this.showConfirmRateModal = false;
        });
    };

    @action setShouldShowRateModal = (value: boolean) => {
        this.showRateModal = value;
    };

    /**
     * Sets the store's value {@link resendCodeCountDown} to the passed value.
     *
     * @param value Number of seconds to set.
     */
    @action
    setResendCodeCountDown(value: number): void {
        this.resendCodeCountDown = value;
    }

    /**
     * Gets count down timer value for email confirmation code resend via messenger,
     * and sets it to the store's value {@link resendCodeCountDown}.
     */
    @action
    async getResendCodeCountDown(): Promise<void> {
        let countDown;
        try {
            countDown = await messenger.getResendCodeCountDown();
        } catch (e) {
            countDown = 0;
        }
        this.setResendCodeCountDown(countDown);
    }

    /**
     * Starts count down timer based on store's value {@link resendCodeCountDown}.
     */
    @action startCountDown = () => {
        this.confirmEmailTimer = setInterval(() => {
            runInAction(() => {
                if (this.resendCodeCountDown === 0) {
                    clearInterval(this.confirmEmailTimer);
                    return;
                }
                this.resendCodeCountDown -= 1;
            });
        }, 1000);
    };

    /**
     * Gets count down timer value for email confirmation code resend from the background,
     * and starts count down timer based on it.
     *
     * Needed for the case when the popup is reopened and the timer was running in the background.
     */
    @action
    async getResendCodeCountDownAndStart(): Promise<void> {
        this.getResendCodeCountDown();
        if (this.resendCodeCountDown > 0) {
            this.startCountDown();
        }
    }

    /**
     * Resets count down timer, starts it again, and sends a message to the background
     * to request a new email confirmation code.
     */
    @action resendEmailConfirmationCode = async () => {
        this.setResendCodeCountDown(DEFAULTS.resendCodeCountDown);
        this.startCountDown();
        await messenger.resendEmailConfirmationCode();
    };

    @action setUserEmail = (value: string) => {
        this.userEmail = value;
    };

    @computed
    get shouldShowHintPopup() {
        // Here we exclude the possibility of a modal window overlapping the hint.
        // TODO: It should be done with correct z-index (AG-24339)
        return this.showHintPopup
            && !this.showRateModal
            && !this.showConfirmRateModal
            && !this.rootStore.settingsStore.showServerErrorPopup
            && !this.rootStore.settingsStore.isVpnBlocked
            // host permissions should be granted to show the hint popup;
            // no `!` is used because of its semantics
            && this.rootStore.settingsStore.isHostPermissionsGranted
            && !this.rootStore.settingsStore.showNotificationModal
            && !this.rootStore.vpnStore.tooManyDevicesConnected;
    }

    @action setShowHintPopup = (value: boolean) => {
        this.showHintPopup = value;
    };

    @action closeHintPopup = async () => {
        await messenger.setHintPopupViewed();
        runInAction(() => {
            this.showHintPopup = false;
        });
    };
}
