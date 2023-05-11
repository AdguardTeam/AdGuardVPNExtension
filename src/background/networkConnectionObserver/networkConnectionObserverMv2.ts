/**
 * Class observes network state
 */
export class NetworkConnectionObserver {
    constructor(callback: () => Promise<void>) {
        window.addEventListener('online', callback);
    }
}
