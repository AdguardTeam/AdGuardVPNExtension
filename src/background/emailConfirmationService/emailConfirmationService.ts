import { runInAction } from 'mobx';

import { RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC } from '../../common/constants';

/**
 * Service for email confirmation.
 *
 * It is used to store confirmation authId and resend code count down.
 */
class EmailConfirmationService {
    private timer: ReturnType<typeof setInterval>;

    private countDown: number | null;

    private confirmationAuthId: string | null;

    private COUNTDOWN_START = RESEND_EMAIL_CONFIRMATION_CODE_DELAY_SEC;

    constructor() {
        this.countDown = null;
        this.confirmationAuthId = null;
    }

    /**
     * Starts count down for resend another email confirmation code.
     */
    public startCountDown(): void {
        if (this.countDown === null) {
            this.countDown = this.COUNTDOWN_START;
            this.timer = setInterval(() => {
                runInAction(() => {
                    this.countDown! -= 1;
                    if (this.countDown === 0) {
                        clearInterval(this.timer);
                    }
                });
            }, 1000);
        }
    }

    /**
     * Resets count down and starts it again.
     */
    public restartCountDown(): void {
        this.countDown = null;
        this.startCountDown();
    }

    /**
     * Current count down value.
     */
    public get resendCodeCountDown(): number | null {
        return this.countDown;
    }

    /**
     * Sets authId for confirmation.
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

export const emailConfirmationService = new EmailConfirmationService();
