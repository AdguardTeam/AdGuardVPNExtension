// FIXME excessive implementation should not be included into build
/* eslint-disable max-classes-per-file */

import { alarmService } from '../alarmService';
import { browserApi } from '../browserApi';

interface SetTimeoutInterface {
    setTimeout(callback: () => void, timeout: number): number;
    clearTimeout(timerId: number): void;
    setInterval(callback: () => void, interval: number): number;
    clearInterval(intervalId: number): void;
}

class MV2Timers implements SetTimeoutInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        return window.setTimeout(callback, timeout);
    };

    clearTimeout = (timerId: number): void => {
        window.clearTimeout(timerId);
    };

    setInterval = (callback: () => void, interval: number): number => {
        return window.setInterval(callback, interval);
    };

    clearInterval = (intervalId: number): void => {
        window.clearInterval(intervalId);
    };
}

class MV3Timers implements SetTimeoutInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        // FIXME implement ids better / to another method
        const timerId = Math.random();
        alarmService.createAlarm(timerId.toString(), timeout);
        alarmService.onAlarmFires(timerId.toString(), callback);
        return timerId;
    };

    clearTimeout = (timerId: number): void => {
        alarmService.clearAlarm(timerId.toString());
    };

    setInterval = (callback: () => void, interval: number): number => {
        // FIXME implement ids better / to another method
        const timerId = Math.random();
        alarmService.createPeriodicAlarm(timerId.toString(), interval);
        alarmService.onAlarmFires(timerId.toString(), callback);
        return timerId;
    };

    clearInterval = (intervalId: number): void => {
        // FIXME check that async can be omitted
        alarmService.clearAlarm(intervalId.toString());
    };
}

export const timers = browserApi.runtime.isManifestVersion2() ? new MV2Timers() : new MV3Timers();
