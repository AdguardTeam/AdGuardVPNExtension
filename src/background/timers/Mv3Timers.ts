import { customAlphabet } from 'nanoid';

import { alarmApi } from './alarmApi';
import { TimersInterface } from './AbstractTimers';

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
