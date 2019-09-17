// stats.proto will be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { WsPingMsg, WsConnectivityMsg } from './stats.proto';
import wsFactory from '../api/websocketApi';
import { WS_API_URL_TEMPLATE } from '../config';
import { renderTemplate } from '../../lib/string-utils';
import log from '../../lib/logger';

const STATS_STATES = {
    WORKING: 'working',
    PAUSED: 'paused',
};

class Stats {
    PING_UPDATE_INTERVAL_MS = 1000 * 60;

    constructor() {
        this.state = STATS_STATES.PAUSED;
    }

    async setHost(host) {
        this.stop();
        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host });

        try {
            this.ws = await wsFactory.getWebsocket(websocketUrl);
        } catch (e) {
            this.state = STATS_STATES.PAUSED;
            throw new Error(`Was unable to create new websocket because of: ${JSON.stringify(e.message)}`);
        }

        this.state = STATS_STATES.WORKING;
        this.start();
    }

    start = async () => {
        this.pingGetInterval = await this.startGettingPing();
        this.startGettingStats();
    };

    stop = () => {
        if (this.pingGetInterval) {
            clearInterval(this.pingGetInterval);
        }
        if (this.ws) {
            this.ws.close();
        }
        this.ping = null;
        this.stats = null;
        this.state = STATS_STATES.PAUSED;
    };

    preparePingMessage = (currentTime) => {
        const pingMsg = WsPingMsg.create({ requestTime: currentTime });
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
                this.updateStats(connectivityInfoMsg);
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

    updateStats = (stats) => {
        log.info(stats);
        this.stats = stats;
    };

    startGettingStats = () => {
        const messageHandler = (event) => {
            const { connectivityInfoMsg } = this.decodeMessage(event.data);
            if (connectivityInfoMsg) {
                this.updateStats(connectivityInfoMsg);
            }
        };

        this.ws.onMessage(messageHandler);
    };

    getPing = () => {
        if (!this.ping || this.state === STATS_STATES.PAUSED) {
            return null;
        }
        return this.ping;
    };

    getStats = () => {
        if (!this.stats || this.state === STATS_STATES.PAUSED) {
            return null;
        }
        let { mbytesDownloaded, downloadSpeedMbytesPerSec } = this.stats;
        mbytesDownloaded = mbytesDownloaded.toFixed(2);
        downloadSpeedMbytesPerSec = downloadSpeedMbytesPerSec.toFixed(2);
        return { mbytesDownloaded, downloadSpeedMbytesPerSec };
    }
}

const stats = new Stats();

export default stats;
