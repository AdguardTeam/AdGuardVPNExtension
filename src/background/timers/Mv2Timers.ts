import { type TimersInterface } from './AbstractTimers';

/**
 * Implements timers interface for MV2.
 */
class Mv2Timers implements TimersInterface {
    setTimeout = (callback: () => void, timeout: number): number => {
        return setTimeout(callback, timeout) as any; // TODO setup tsconfig to fix types
    };

    clearTimeout = (timerId: number): void => {
        clearTimeout(timerId);
    };

    setInterval = (callback: () => void, interval: number): number => {
        return setInterval(callback, interval) as any; // TODO setup tsconfig to fix types
    };

    clearInterval = (intervalId: number): void => {
        clearInterval(intervalId);
    };
}

export const timers = new Mv2Timers();
