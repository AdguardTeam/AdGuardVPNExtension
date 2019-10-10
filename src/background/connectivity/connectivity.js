// connectivity.proto will be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { WsPingMsg, WsConnectivityMsg } from './connectivity.proto';
import wsFactory from '../api/websocketApi';
import { WS_API_URL_TEMPLATE } from '../config';
import { renderTemplate } from '../../lib/string-utils';
import log from '../../lib/logger';

const CONNECTIVITY_STATE = {
    WORKING: 'working',
    PAUSED: 'paused',
};

class Connectivity {
    PING_UPDATE_INTERVAL_MS = 1000 * 60;

    constructor() {
        this.state = CONNECTIVITY_STATE.PAUSED;
    }

    async setCredentials(host, vpnToken) {
        this.stop();
        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host });
        this.vpnToken = vpnToken;

        try {
            this.ws = await wsFactory.getWebsocket(websocketUrl);
        } catch (e) {
            this.state = CONNECTIVITY_STATE.PAUSED;
            throw new Error(`Was unable to create new websocket because of: ${JSON.stringify(e.message)}`);
        }

        this.state = CONNECTIVITY_STATE.WORKING;
        this.start();
    }

    stringToUint8Array = (str) => {
        return new TextEncoder('utf-8').encode(str);
    };

    start = async () => {
        this.pingGetInterval = await this.startGettingPing();
        this.startGettingConnectivityInfo();
    };

    stop = () => {
        if (this.pingGetInterval) {
            clearInterval(this.pingGetInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
        this.ping = null;
        this.connectivityInfo = null;
        this.state = CONNECTIVITY_STATE.PAUSED;
    };

    preparePingMessage = (currentTime) => {
        const pingMsg = WsPingMsg.create({
            requestTime: currentTime,
            token: this.stringToUint8Array(this.vpnToken),
        });
        const protocolMsg = WsConnectivityMsg.create({ pingMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    decodeMessage = (arrBufMessage) => {
        const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
        return WsConnectivityMsg.toObject(message);
    };

    pollPing = () => new Promise((resolve) => {
        const arrBufMessage = this.preparePingMessage(Date.now());
        this.ws.send(arrBufMessage);

        const messageHandler = (event) => {
            const receivedTime = Date.now();
            const { pingMsg, connectivityInfoMsg } = this.decodeMessage(event.data);
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                this.ws.removeMessageListener(messageHandler);
                resolve(ping);
            }
            if (connectivityInfoMsg) {
                this.updateConnectivityInfo(connectivityInfoMsg);
            }
        };

        this.ws.onMessage(messageHandler);
    });

    getAveragePing = async () => {
        const POLLS_NUM = 3;
        const results = [];
        for (let i = 0; i < POLLS_NUM; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const result = await this.pollPing();
            results.push(result);
        }
        const sum = results.reduce((prev, next) => prev + next);
        return Math.floor(sum / POLLS_NUM);
    };

    updatePingValue = (ping) => {
        log.info(ping);
        this.ping = ping;
    };

    startGettingPing = async () => {
        const averagePing = await this.getAveragePing();
        this.updatePingValue(averagePing);

        this.pingGetInterval = setInterval(async () => {
            const averagePing = await this.getAveragePing();
            this.updatePingValue(averagePing);
        }, this.PING_UPDATE_INTERVAL_MS);
    };

    updateConnectivityInfo = (stats) => {
        log.info(stats);
        this.connectivityInfo = stats;
    };

    startGettingConnectivityInfo = () => {
        const messageHandler = (event) => {
            const { connectivityInfoMsg } = this.decodeMessage(event.data);
            if (connectivityInfoMsg) {
                this.updateConnectivityInfo(connectivityInfoMsg);
            }
        };

        this.ws.onMessage(messageHandler);
    };

    getPing = () => {
        if (!this.ping || this.state === CONNECTIVITY_STATE.PAUSED) {
            return null;
        }
        return this.ping;
    };

    getStats = () => {
        if (!this.connectivityInfo || this.state === CONNECTIVITY_STATE.PAUSED) {
            return null;
        }
        const { bytesDownloaded, bytesUploaded } = this.connectivityInfo;
        return { bytesDownloaded, bytesUploaded };
    };
}

const connectivity = new Connectivity();

export default connectivity;
