import { customAlphabet } from 'nanoid';

import { alarmApi } from './alarmApi';
import { TimersInterface } from './AbstractTimers';

/**
 * Implements timers interface via Alarm API to be used in MV3.
 * Alarm API used in MV3 for long timers, that could be interrupted by the service worker's death.
 */
class Mv3Timers implements TimersInterface {
    generateId() {
        const nanoid = customAlphabet('1234567890', 10);
        const id = nanoid();
        return parseInt(id, 10);
    }

    setTimeout = (callback: () => void, timeout: number): number => {
        const timerId = this.generateId();
        alarmApi.createAlarm(`${timerId}`, timeout);
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    clearTimeout = (timerId: number): void => {
        alarmApi.clearAlarm(`${timerId}`);
    };

    setInterval = (callback: () => void, interval: number): number => {
        const timerId = this.generateId();
        alarmApi.createPeriodicAlarm(`${timerId}`, interval);
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    clearInterval = (intervalId: number): void => {
        alarmApi.clearAlarm(`${intervalId}`);
    };
}

export const timers = new Mv3Timers();
