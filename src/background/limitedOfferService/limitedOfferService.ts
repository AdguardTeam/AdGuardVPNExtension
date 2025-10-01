import { isRuLocale } from '../../common/utils/promo';
import { translator } from '../../common/translator';
import { ONE_DAY_MS, ONE_HOUR_MS } from '../../common/constants';
import { log } from '../../common/logger';
import { type BrowserApi, browserApi } from '../browserApi';
import { credentials } from '../credentials';
import { notifications } from '../notifications';
import { StateData } from '../stateStorage';
import { StorageKey } from '../schema';
import { ForwarderUrlQueryKey } from '../config';

/**
 * Limited offer data type needed for popup.
 */
export type LimitedOfferData = {
    /**
     * Time left in milliseconds until limited offer is available.
     */
    timeLeftMs: number;

    /**
     * Years of subscription in limited offer for free account users.
     */
    years: number;

    /**
     * Discount in percents.
     */
    discount: number;

    /**
     * Forwarder URL query key.
     */
    forwarderUrlQueryKey: ForwarderUrlQueryKey;
};

/**
 * Service for limited offer for free account users.
 */
class LimitedOfferService {
    private browserApi: BrowserApi;

    /**
     * Years of subscription in limited offer common for all users.
     */
    private LIMITED_OFFER_YEARS = 2;

    /**
     * Years of subscription in limited offer only for russian users.
     */
    private LIMITED_OFFER_YEARS_RU = 1;

    /**
     * Discount in percents in limited offer common for all users.
     */
    private LIMITED_OFFER_DISCOUNT_PERCENT = 80;

    /**
     * Discount in percents in limited offer only for russian users.
     */
    private LIMITED_OFFER_DISCOUNT_RU_PERCENT = 75;

    private COUNTDOWN_DATA_KEY = 'limited.offer.countdown.data';

    /**
     * Delay in seconds after registration
     * after which limited offer should be shown to free account users.
     */
    private LIMITED_OFFER_DELAY_AFTER_REGISTRATION_MS = ONE_DAY_MS * 3;

    /**
     * Timestamp in milliseconds for `Feb 07 2024 00:00:00 GMT+0000` —
     * minimum registration time for limited offer availability
     * as it should be shown only to new users.
     */
    private LIMITED_OFFER_REGISTRATION_TIME_MIN_MS = 1707264000000;

    /**
     * Time of limited offer availability in milliseconds.
     */
    private LIMITED_OFFER_DURATION_MS = ONE_HOUR_MS * 6;

    /**
     * Limited offer service state data.
     * Used to save and retrieve limited offer state from session storage,
     * in order to persist it across service worker restarts.
     */
    private limitedOfferState = new StateData(StorageKey.LimitedOfferService);

    constructor(providedBrowserApi: BrowserApi) {
        this.browserApi = providedBrowserApi;
    }

    /**
     * Returns limited offer countdown start timestamp in MILLISECONDS.
     *
     * @param username Username of the user for whom countdown start timestamp should be returned.
     * Needed to show limited offer to free account users only once,
     * avoid its showing on signing out and signing in again.
     *
     * @returns Timestamp in milliseconds on which limited offer countdown was started
     * or `null` if countdown was not started yet.
     */
    getCountdownStart = async (username: string): Promise<number | null | undefined> => {
        let limitedOfferStorageData = await this.limitedOfferState.get();
        if (!limitedOfferStorageData) {
            limitedOfferStorageData = await this.browserApi.storage.get(this.COUNTDOWN_DATA_KEY) || {};
            await this.limitedOfferState.set(limitedOfferStorageData);
        }

        // no user data in storage yet means that countdown was not started yet
        if (!limitedOfferStorageData[username]) {
            return null;
        }

        const countdownStartMs = limitedOfferStorageData[username];

        if (!countdownStartMs) {
            return null;
        }

        return countdownStartMs;
    };

    /**
     * Sets limited offer countdown start timestamp in MILLISECONDS in storage.
     *
     * @param username Username of the user for whom countdown start timestamp should be set.
     * @param countdownStartMs Timestamp in milliseconds on which countdown was started.
     */
    setCountdownStart = async (
        username: string,
        countdownStartMs: number | null,
    ): Promise<void> => {
        const limitedOfferStorageData = await this.limitedOfferState.get();
        if (!limitedOfferStorageData) {
            log.error('Unable to get limited offer data from storage');
            return;
        }

        limitedOfferStorageData[username] = countdownStartMs;
        await this.limitedOfferState.set(limitedOfferStorageData);
        await this.browserApi.storage.set(this.COUNTDOWN_DATA_KEY, limitedOfferStorageData);
    };

    /**
     * Returns limited offer countdown in MILLISECONDS.
     *
     * @param username Username of the user for whom countdown should be returned.
     *
     * @returns Countdown in milliseconds or null if countdown is over.
     */
    private async getLimitedOfferCountdown(username: string): Promise<number | null> {
        const countdownStartMs = await this.getCountdownStart(username);

        // if there no countdown yet, it should be started
        if (!countdownStartMs) {
            // init the countdown start timestamp
            await this.setCountdownStart(username, Date.now());
            // and return full time of limited offer
            return this.LIMITED_OFFER_DURATION_MS;
        }

        const timePassedMs = Date.now() - countdownStartMs;

        if (timePassedMs < 0) {
            // user may change system time back
            // so the countdown should be updated in order to be synced with returned value
            await this.setCountdownStart(username, Date.now());
            // so limited offer timer should not be more than LIMITED_OFFER_DURATION_MS
            return this.LIMITED_OFFER_DURATION_MS;
        }

        const timeLeftMs = this.LIMITED_OFFER_DURATION_MS - timePassedMs;

        if (timeLeftMs > this.LIMITED_OFFER_DURATION_MS) {
            // user may change system time
            // so limited offer timer should not be more than LIMITED_OFFER_DURATION_MS
            return this.LIMITED_OFFER_DURATION_MS;
        }

        if (timeLeftMs <= 0) {
            return null;
        }

        return timeLeftMs;
    }

    /**
     * Creates notification about limited offer.
     *
     * @param discount Discount in percents.
     */
    private async createNotification(discount: number): Promise<void> {
        await notifications.create({
            title: translator.getMessage('limited_offer_notification_title', { discount }),
            message: translator.getMessage('limited_offer_notification_desc'),
        });
    }

    /**
     * Checks whether browser notification about limited offer should be shown.
     *
     * @param username Username of the user for whom notification should be shown.
     *
     * @returns Promise with true if browser notification should be shown, false otherwise.
     */
    private async shouldShowNotification(username: string): Promise<boolean> {
        const countdownStartMs = await this.getCountdownStart(username);
        // if there no countdown yet, the notification should be shown
        // as it should be shown only once
        return !countdownStartMs;
    }

    /**
     * Returns limited offer data for the current user.
     *
     * Limited offer should be shown:
     * 1. if the current user was registered more than 72 hours (3 days) ago.
     * 1. if the user is "new" — registered after {@link LIMITED_OFFER_REGISTRATION_TIME_MIN_MS}.
     *
     * @returns Limited offer data or null if limited offer should not be shown.
     */
    public async getLimitedOfferData(): Promise<LimitedOfferData | null> {
        const { username, registrationTimeISO } = await credentials.getUsernameAndRegistrationTimeISO();

        // check it before the countdown start value is set to storage for user
        const shouldShowNotification = await this.shouldShowNotification(username);

        const registrationTimeMs = new Date(registrationTimeISO).getTime();

        // do not show the limited offer if user has registered before specified date
        if (registrationTimeMs < this.LIMITED_OFFER_REGISTRATION_TIME_MIN_MS) {
            return null;
        }

        // do not show the limited offer if user has registered less than 3 days ago
        if (Date.now() - registrationTimeMs < this.LIMITED_OFFER_DELAY_AFTER_REGISTRATION_MS) {
            return null;
        }

        const timeLeftMs = await this.getLimitedOfferCountdown(username);

        // if countdown is over, do not show the limited offer
        if (!timeLeftMs) {
            return null;
        }

        if (isRuLocale) {
            if (shouldShowNotification) {
                await this.createNotification(this.LIMITED_OFFER_DISCOUNT_RU_PERCENT);
            }

            return {
                timeLeftMs,
                years: this.LIMITED_OFFER_YEARS_RU,
                discount: this.LIMITED_OFFER_DISCOUNT_RU_PERCENT,
                forwarderUrlQueryKey: ForwarderUrlQueryKey.LimitedOfferRu,
            };
        }

        if (shouldShowNotification) {
            await this.createNotification(this.LIMITED_OFFER_DISCOUNT_PERCENT);
        }

        return {
            timeLeftMs,
            years: this.LIMITED_OFFER_YEARS,
            discount: this.LIMITED_OFFER_DISCOUNT_PERCENT,
            forwarderUrlQueryKey: ForwarderUrlQueryKey.LimitedOffer,
        };
    }
}

export const limitedOfferService = new LimitedOfferService(browserApi);
