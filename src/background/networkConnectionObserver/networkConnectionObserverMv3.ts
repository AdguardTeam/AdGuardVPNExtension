// TODO: fix NetworkConnectionObserver implementation:
//  listen for the online event, when it will be fixed in mv3,
//  instead of using setInterval to check navigator.onLine
//  https://bugs.chromium.org/p/chromium/issues/detail?id=1442046#c7

/**
 * Class observes network state
 */
export class NetworkConnectionObserver {
    private readonly CHECK_ONLINE_INTERVAL_MS = 500;

    private readonly onlineHandler: () => Promise<void>;

    private isOnline: boolean;

    constructor(callback: () => Promise<void>) {
        this.onlineHandler = callback;
        this.isOnline = navigator.onLine;
        this.startCheckIsOnline();
    }

    /**
     * Starts checking if the network connection is online at a specified time interval.
     */
    private startCheckIsOnline() {
        setInterval(() => {
            this.setIsOnline(navigator.onLine);
        }, this.CHECK_ONLINE_INTERVAL_MS);
    }

    /**
     * Calls handler if network connection becomes online and sets isOnline value.
     */
    private setIsOnline(isOnline: boolean) {
        if (isOnline && !this.isOnline) {
            this.onlineHandler();
        }
        this.isOnline = isOnline;
    }
}
