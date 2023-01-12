import { alarmApi } from './alarmApi';
import { TimersInterface } from './AbstractTimers';

class MV3Timers implements TimersInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        const timerId = Math.random();
        alarmApi.createAlarm(`${timerId}`, timeout);
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    clearTimeout = (timerId: number): void => {
        alarmApi.clearAlarm(`${timerId}`);
    };

    setInterval = (callback: () => void, interval: number): number => {
        const timerId = Math.random();
        alarmApi.createPeriodicAlarm(`${timerId}`, interval);
        alarmApi.onAlarmFires(`${timerId}`, callback);
        return timerId;
    };

    clearInterval = (intervalId: number): void => {
        alarmApi.clearAlarm(`${intervalId}`);
    };
}

export const timers = new MV3Timers();
