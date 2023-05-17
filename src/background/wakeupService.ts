import browser from 'webextension-polyfill';

const WAKEUP_PERIOD_MS = 1000 * 60 * 4.5; // 4 min 30 sec
const SERVICE_WORKER_WAKEUP = 'serviceWorkerWakeUp';

interface CustomPortType extends browser.Runtime.Port {
    timer?: number;
}

class WakeupService {
    deleteTimer = (port: CustomPortType) => {
        if (port.timer) {
            clearTimeout(port.timer);
            // eslint-disable-next-line no-param-reassign
            delete port.timer;
        }
    };

    forceReconnect = (port: CustomPortType) => {
        this.deleteTimer(port);
        port.disconnect();
    };

    init = () => {
        browser.runtime.onConnect.addListener((port: CustomPortType) => {
            if (port.name === SERVICE_WORKER_WAKEUP) {
                port.onDisconnect.addListener(this.deleteTimer);
                // @ts-ignore
                // eslint-disable-next-line no-param-reassign
                port.timer = setTimeout(this.forceReconnect, WAKEUP_PERIOD_MS, port);
            }
        });
    };
}

export const wakeupService = new WakeupService();
