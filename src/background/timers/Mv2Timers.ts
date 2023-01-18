import { TimersInterface } from './AbstractTimers';

/**
 * Implements timers interface for MV2.
 */
class Mv2Timers implements TimersInterface {
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

export const timers = new Mv2Timers();
