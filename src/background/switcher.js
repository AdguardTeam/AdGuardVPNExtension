import { runWithCancel } from '../lib/helpers';
import proxy from './proxy';
import actions from './actions';
import log from '../lib/logger';
import browserApi from './browserApi';
import { MESSAGES_TYPES } from '../lib/constants';
import webrtc from './browserApi/webrtc';
import credentials from './credentials';
import connectivity from './connectivity';

function* turnOnProxy() {
    try {
        const accessCredentials = yield credentials.getAccessCredentials();
        const { domainName } = yield proxy.setAccessPrefix(accessCredentials.prefix);
        const wsHost = `${accessCredentials.prefix}.${domainName}`;
        yield connectivity.endpointConnectivity.setCredentials(
            wsHost,
            domainName,
            accessCredentials.token,
            true
        );
        yield proxy.turnOn();
        webrtc.blockWebRTC();
        yield actions.setIconEnabled();
        browserApi.runtime.sendMessage({ type: MESSAGES_TYPES.EXTENSION_PROXY_ENABLED });
    } catch (e) {
        yield connectivity.endpointConnectivity.stop();
        yield proxy.turnOff();
        webrtc.unblockWebRTC();
        yield actions.setIconDisabled();
        browserApi.runtime.sendMessage({ type: MESSAGES_TYPES.EXTENSION_PROXY_DISABLED });
        log.error(e && e.message);
        throw e;
    }
}

function* turnOffProxy() {
    try {
        yield connectivity.endpointConnectivity.stop();
        yield proxy.turnOff();
        webrtc.unblockWebRTC();
        yield actions.setIconDisabled();
        browserApi.runtime.sendMessage({ type: MESSAGES_TYPES.EXTENSION_PROXY_DISABLED });
    } catch (e) {
        log.error(e && e.message);
        throw e;
    }
}

class Switcher {
    turnOn(withCancel) {
        if (this.cancel && withCancel) {
            this.cancel();
        }
        const { promise, cancel } = runWithCancel(turnOnProxy);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }

    turnOff(withCancel) {
        if (this.cancel && withCancel) {
            this.cancel();
        }
        const { promise, cancel } = runWithCancel(turnOffProxy);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }
}

const switcher = new Switcher();

export default switcher;
