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
     * @param time
     */
    convertMsToMin = (time: number): number => time / (1000 * 60);

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
     * note, that in Alarm API interval cannot be less than 1 minute (60000 ms)
     * https://developer.chrome.com/docs/extensions/reference/alarms/#method-create
     * @param callback
     * @param interval in ms
     */
    setInterval = (callback: () => void, interval: number): number => {
        const timerId = this.generateId();

        const intervalMinutes = this.convertMsToMin(interval);
        if (intervalMinutes < MINIMAL_INTERVAL_MIN) {
            throw new Error('The interval can\'t be less than 1 minute');
        }

        alarmApi.createPeriodicAlarm(`${timerId}`, intervalMinutes);
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
