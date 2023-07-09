import { runInAction } from 'mobx';

class EmailService {
    private timer: ReturnType<typeof setInterval>;

    private countDown: number | null;

    private COUNTDOWN_START = 30;

    constructor() {
        this.countDown = null;
    }

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

    public restartCountDown(): void {
        this.countDown = null;
        this.startCountDown();
    }

    public get resendLinkCountDown(): number | null {
        return this.countDown;
    }
}

export const emailService = new EmailService();
