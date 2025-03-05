/**
 * Class observes network state
 */
export class NetworkConnectionObserver {
    private readonly onlineHandler: () => Promise<void>;

    constructor(callback: () => Promise<void>) {
        this.onlineHandler = callback;
    }

    /**
     * Initializes the network connection observer.
     */
    public init() {
        window.addEventListener('online', this.onlineHandler);
    }
}
