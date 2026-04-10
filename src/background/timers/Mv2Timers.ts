import { type TimersInterface } from './AbstractTimers';

/**
 * Implements timers interface for MV2.
 */
class Mv2Timers implements TimersInterface {
    public setTimeout = (callback: () => void, timeout: number): number => {
        return setTimeout(callback, timeout) as any; // TODO setup tsconfig to fix types
    };

    public clearTimeout = (timerId: number): void => {
        clearTimeout(timerId);
    };

    public setInterval = (callback: () => void, interval: number): number => {
        return setInterval(callback, interval) as any; // TODO setup tsconfig to fix types
    };

    public clearInterval = (intervalId: number): void => {
        clearInterval(intervalId);
    };
}

export const timers = new Mv2Timers();
