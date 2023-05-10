/**
 * export './networkConnectionObserverAbstract' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper implementation
 * from './networkConnectionObserverMv2' or './networkConnectionObserverMv3'
 */
class NetworkConnectionObserver {
    constructor() {
        this.errorFunction();
    }

    errorFunction = () => {
        throw new Error('Seems like webpack didn\'t inject proper NetworkConnectionObserver');
    };

    init() {
        this.errorFunction();
    }
}

export const networkConnectionObserver = new NetworkConnectionObserver();
