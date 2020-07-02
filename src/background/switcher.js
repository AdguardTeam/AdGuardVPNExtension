import { runWithCancel } from '../lib/helpers';
import proxy from './proxy';
import log from '../lib/logger';
import webrtc from './browserApi/webrtc';
import credentials from './credentials';
import connectivity from './connectivity';
import notifier from '../lib/notifier';
import { FORCE_CANCELLED } from '../lib/constants';
import { locationsService } from './endpoints/locationsService';

function* turnOnProxy() {
    try {
        const selectedLocation = yield locationsService.getSelectedLocation();
        const selectedEndpoint = yield locationsService.getEndpointByLocation(selectedLocation);

        if (selectedEndpoint) {
            yield proxy.setCurrentEndpoint(selectedEndpoint, selectedLocation);
        }

        const accessCredentials = yield credentials.getAccessCredentials();

        const { domainName } = yield proxy.setAccessPrefix(
            accessCredentials.credentialsHash,
            accessCredentials.credentials
        );

        yield connectivity.endpointConnectivity.setCredentials(
            domainName,
            accessCredentials.token,
            accessCredentials.credentialsHash,
            true
        );

        notifier.notifyListeners(notifier.types.PROXY_TURNED_ON);
    } catch (e) {
        yield connectivity.endpointConnectivity.stop();
        notifier.notifyListeners(notifier.types.PROXY_TURNED_OFF);
        log.error(e && e.message);
        throw e;
    }
}

function* turnOffProxy() {
    try {
        yield connectivity.endpointConnectivity.stop();
        // TODO move proxy turn on off to the endpoint connectivity handler
        // yield proxy.turnOff();
        // webrtc.unblockWebRTC();
        notifier.notifyListeners(notifier.types.PROXY_TURNED_OFF);
    } catch (e) {
        log.error(e && e.message);
        throw e;
    }
}

class Switcher {
    turnOn(withCancel) {
        if (this.cancel && withCancel) {
            this.cancel(FORCE_CANCELLED);
        }
        const { promise, cancel } = runWithCancel(turnOnProxy);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }

    turnOff(withCancel) {
        if (this.cancel && withCancel) {
            this.cancel(FORCE_CANCELLED);
        }
        const { promise, cancel } = runWithCancel(turnOffProxy);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }
}

export const switcher = new Switcher();
