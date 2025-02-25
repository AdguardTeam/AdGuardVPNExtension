import { type BrowserApi, browserApi } from '../browserApi';
import { RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC } from '../../common/constants';

/**
 * Service for resending registration confirmation link.
 *
 * It is used to resend confirmation link and store resend link countdown.
 */
class RegistrationConfirmationService {
    browserApi: BrowserApi;

    private COUNTDOWN_START_KEY = 'resend.registration.confirmation.countdown.start.time';

    /**
     * Timestamp in milliseconds on which countdown was started last time.
     */
    private countdownStartMs: number | null;

    constructor(providedBrowserApi: BrowserApi) {
        this.browserApi = providedBrowserApi;
    }

    /**
     * Returns resend link countdown start timestamp in MILLISECONDS.
     *
     * If there is no value for {@link countdownStartMs}, it will be fetched from storage.
     *
     * @returns Timestamp in milliseconds on which countdown was started last time
     * or null if countdown was not started.
     */
    private getResendLinkCountdownStartFromStorage = async (): Promise<number | null> => {
        if (this.countdownStartMs) {
            return this.countdownStartMs;
        }
        this.countdownStartMs = await this.browserApi.storage.get(this.COUNTDOWN_START_KEY) || null;
        return this.countdownStartMs;
    };

    /**
     * Sets resend link countdown start timestamp in MILLISECONDS in storage.
     *
     * @param countdownStart Timestamp in milliseconds on which countdown was started last time.
     */
    private setResendLinkCountdownStartToStorage = async (countdownStart: number | null): Promise<void> => {
        this.countdownStartMs = countdownStart;
        await this.browserApi.storage.set(this.COUNTDOWN_START_KEY, countdownStart);
    };

    /**
     * Resets countdown and starts it again.
     */
    public restartCountdown(): void {
        this.setResendLinkCountdownStartToStorage(Date.now());
    }

    /**
     * Returns number of SECONDS left until user can request another email.
     *
     * @returns Number of seconds left or null if countdown was not started or already finished.
     */
    public async getLinkCountdown(): Promise<number | null> {
        const countdownStartMs = await this.getResendLinkCountdownStartFromStorage();
        if (!countdownStartMs) {
            return null;
        }

        const countdownSec = RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC - Math.round(
            (Date.now() - countdownStartMs) / 1000,
        );
        return countdownSec > 0
            ? countdownSec
            : null;
    }
}

export const registrationConfirmationService = new RegistrationConfirmationService(browserApi);
