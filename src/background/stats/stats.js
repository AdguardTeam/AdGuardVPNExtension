// stats.proto would be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { WsPingMsg, WsConnectivityMsg } from './stats.proto';
import { websocketApi } from '../api/websocketApi';
import log from '../../lib/logger';

class Stats {
    // TODO [maximtop] change this to request ping once per minute
    PING_GET_INTERVAL_MS = 1000;

    constructor() {
        this.startGettingPing((ping) => {
            if (this.pingCallback && typeof this.pingCallback === 'function') {
                try {
                    this.pingCallback(ping);
                } catch (e) {
                    // Usually error happens only on popup close
                    // TODO [maximtop] figure out how to disconnect this callback after popup closed
                    log.error(e.message);
                }
            }
        });
    }

    createPingMessage = (currentTime) => {
        const pingMsg = WsPingMsg.create({ requestTime: currentTime });
        const protocolMsg = WsConnectivityMsg.create({ pingMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    startGettingPing = (callback) => {
        setInterval(() => {
            const buffer = this.createPingMessage(Date.now());
            websocketApi.send(buffer);
        }, this.PING_GET_INTERVAL_MS);

        websocketApi.onMessage((event) => {
            const receivedTime = Date.now();
            const message = WsConnectivityMsg.decode(new Uint8Array(event.data));
            const messageObj = WsConnectivityMsg.toObject(message);
            const { pingMsg } = messageObj;
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                callback(ping);
            }
        });
    };

    setPingCallback = (pingCallback) => {
        this.pingCallback = pingCallback;
    };
}

const stats = new Stats();

export default stats;
