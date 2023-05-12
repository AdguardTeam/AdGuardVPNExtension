/**
 * export './networkConnectionObserverAbstract' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper implementation
 * from './networkConnectionObserverMv2' or './networkConnectionObserverMv3'
 */
export class NetworkConnectionObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(arg?: unknown) {
        throw new Error('Seems like webpack didn\'t inject proper NetworkConnectionObserver');
    }
}
