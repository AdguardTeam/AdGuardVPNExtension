import { type BrowserApi, browserApi } from '../browserApi';
import { RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC } from '../../common/constants';

/**
 * Service for email confirmation.
 *
 * It is used to store confirmation authId and resend code countdown.
 */
class EmailConfirmationService {
    browserApi: BrowserApi;

    /**
     * Email for which countdown is started.
     *
     * Needed to check if resend code countdown should be restarted on popup navigation,
     * i.e. if user's email should be confirmed but user navigates back and changes the password —
     * countdown should not be restarted in this case.
     */
    private email: string | null;

    /**
     * Value of 'auth_id' field from server response of registration or authorization request
     * if user should confirm email.
     */
    private confirmationAuthId: string | null;

    private COUNTDOWN_START_KEY = 'resend.code.countdown.start.time';

    /**
     * Timestamp in milliseconds on which countdown was started last time.
     */
    private countdownStartMs: number | null;

    constructor(providedBrowserApi: BrowserApi) {
        this.browserApi = providedBrowserApi;
        this.confirmationAuthId = null;
    }

    /**
     * Returns resend code countdown start timestamp in MILLISECONDS.
     *
     * If there is no value for {@link countdownStartMs}, it will be fetched from storage.
     *
     * @returns Timestamp in milliseconds on which countdown was started last time
     * or null if countdown was not started.
     */
    private getResentCodeCountdownStartFromStorage = async (): Promise<number | null> => {
        if (this.countdownStartMs) {
            return this.countdownStartMs;
        }
        this.countdownStartMs = await this.browserApi.storage.get(this.COUNTDOWN_START_KEY) || null;
        return this.countdownStartMs;
    };

    /**
     * Sets resend code countdown start timestamp in MILLISECONDS in storage.
     *
     * @param countdownStart Timestamp in milliseconds on which countdown was started last time.
     */
    private setResentCodeCountdownStartToStorage = async (countdownStart: number | null): Promise<void> => {
        this.countdownStartMs = countdownStart;
        await this.browserApi.storage.set(this.COUNTDOWN_START_KEY, countdownStart);
    };

    /**
     * Resets countdown and starts it again if the timer has not been started yet.
     *
     * @param email User email for which countdown should be restarted.
     * If provided and is the same as previous, countdown is not restarted.
     * If not provided, countdown is restarted anyway.
     */
    public restartCountdown(email?: string): void {
        // if email is provided, check if it is the same as previous
        if (typeof email !== 'undefined') {
            if (this.email === email) {
                // do not restart countdown if email is the same
                return;
            }
            // update email value
            this.email = email;
        }

        this.setResentCodeCountdownStartToStorage(Date.now());
    }

    /**
     * Returns number of SECONDS left until user can request another code.
     *
     * @returns Number of seconds left or null if countdown was not started or already finished.
     */
    public async getCodeCountdown(): Promise<number | null> {
        const countdownStartMs = await this.getResentCodeCountdownStartFromStorage();
        if (!countdownStartMs) {
            return null;
        }

        // eslint-disable-next-line max-len
        const countdownSec = RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC - Math.round((Date.now() - countdownStartMs) / 1000);
        return countdownSec > 0
            ? countdownSec
            : null;
    }

    /**
     * Sets authId which is needed for email confirmation,
     * i.e. for requesting another code.
     *
     * @param authId AuthId.
     */
    public setAuthId(authId: string) {
        this.confirmationAuthId = authId;
    }

    /**
     * Returns authId for confirmation.
     */
    public get authId(): string | null {
        return this.confirmationAuthId;
    }
}

export const emailConfirmationService = new EmailConfirmationService(browserApi);
