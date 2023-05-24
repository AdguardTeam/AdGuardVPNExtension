import { customAlphabet } from 'nanoid';

import { alarmApi } from './alarmApi';
import { TimersInterface } from './AbstractTimers';
import { log } from '../../lib/logger';

const MINIMAL_INTERVAL_MIN = 1;

/**
 * Implements timers interface via Alarm API to be used in MV3.
 * Alarm API used in MV3 for long timers, that could be interrupted by the service worker's death.
 */
class Mv3Timers implements TimersInterface {
    /**
     * Generates ID
     */
    generateId(): number {
        const nanoid = customAlphabet('1234567890', 10);
        const id = nanoid();
        return parseInt(id, 10);
    }

    /**
     * Converts milliseconds to minutes
     * @param timeMs
     */
    convertMsToMin = (timeMs: number): number => {
        let timeMin = timeMs / (1000 * 60);

        // Interval cannot be less than 1 minute in Alarm API.
        // https://developer.chrome.com/docs/extensions/reference/alarms/#method-create
        // So if converted time is less than 1 minute, we round it to the 1
        if (timeMin < MINIMAL_INTERVAL_MIN) {
            log.warn('Alarm API interval can\'t be less than 1 minute, so it was rounded to 1');
            timeMin = MINIMAL_INTERVAL_MIN;
        }

        return timeMin;
    };

    /**
     * setTimeout implementation
     * @param callback
     * @param timeout in ms
     */
    setTimeout = (callback: () => void, timeout: number): number => {
        const timerId = this.generateId();
        alarmApi.createAlarm(`${timerId}`, timeout);
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    /**
     * clearTimeout implementation
     * @param timerId
     */
    clearTimeout = (timerId: number): void => {
        alarmApi.clearAlarm(`${timerId}`);
    };

    /**
     * setInterval implementation
     * @param callback
     * @param interval in ms
     */
    setInterval = (callback: () => void, interval: number): number => {
        const timerId = this.generateId();
        alarmApi.createPeriodicAlarm(`${timerId}`, this.convertMsToMin(interval));
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    /**
     * clearInterval implementation
     * @param intervalId
     */
    clearInterval = (intervalId: number): void => {
        alarmApi.clearAlarm(`${intervalId}`);
    };
}

export const timers = new Mv3Timers();
