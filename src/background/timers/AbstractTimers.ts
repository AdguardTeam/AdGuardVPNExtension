/* eslint-disable @typescript-eslint/no-unused-vars */

export interface TimersInterface {
    setTimeout(callback: () => void, timeout: number): number;
    clearTimeout(timerId: number): void;
    setInterval(callback: () => void, interval: number): number;
    clearInterval(intervalId: number): void;
}

/**
 * This class used only to show timers interface
 * export './AbstractTimers' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper implementation
 * from './Mv2Timers' or './Mv3Timers'
 */
class AbstractTimers implements TimersInterface {
    private throwError(): void {
        throw new Error('Seems like webpack didn\'t inject proper timers');
    }

    public setTimeout = (callback: () => void, timeout: number): number => {
        this.throwError();
        // redundant return used for proper implementation of TimersInterface
        return 0;
    };

    public clearTimeout = (timerId: number): void => this.throwError();

    public setInterval = (callback: () => void, interval: number): number => {
        this.throwError();
        // redundant return used for proper implementation of TimersInterface
        return 0;
    };

    public clearInterval = (intervalId: number): void => this.throwError();
}

export const timers = new AbstractTimers();
