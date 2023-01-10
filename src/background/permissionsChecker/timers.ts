import { alarmService } from '../alarmService';
import { browserApi } from '../browserApi';

interface SetTimeoutInterface {
    setTimeout(callback: () => void, timeout: number): number;
    clearTimeout(timerId: number): void;
}

class MV2Timers implements SetTimeoutInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        return window.setTimeout(callback, timeout);
    }

    clearTimeout = (timerId: number): void => {
        clearTimeout(timerId);
    }
}

class MV3Timers implements SetTimeoutInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        const timerId = Math.random();
        alarmService.createAlarm(timerId.toString(), timeout);
        alarmService.onAlarmFires(timerId.toString(), callback);
        return timerId;
    }

    clearTimeout = (timerId: number): void => {
        alarmService.clearAlarm(timerId.toString());
    }
}

export const timers = browserApi.runtime.isManifestVersion2() ? new MV2Timers() : new MV3Timers();
