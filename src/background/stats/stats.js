// stats.proto would be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { WsPingMsg, WsConnectivityMsg } from './stats.proto';
import { websocketApi } from '../api/websocketApi';

class Stats {
    // TODO [maximtop] change this to update ping once per minute
    PING_UPDATE_INTERVAL_MS = 1000 * 5;

    constructor() {
        this.init();
    }

    init = async () => {
        await websocketApi.open();
        await this.startGettingPing();
        this.startGettingStats();
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
        websocketApi.send(arrBufMessage);

        const messageHandler = (event) => {
            const receivedTime = Date.now();
            const { pingMsg, connectivityInfoMsg } = this.decodeMessage(event.data);
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                websocketApi.removeMessageListener(messageHandler);
                resolve(ping);
            }
            if (connectivityInfoMsg) {
                this.updateStats(connectivityInfoMsg);
            }
        };

        websocketApi.onMessage(messageHandler);
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
        console.log(ping);
        this.ping = ping;
    };

    startGettingPing = async () => {
        const averagePing = await this.getAveragePing();
        this.updatePingValue(averagePing);

        setInterval(async () => {
            const averagePing = await this.getAveragePing();
            this.updatePingValue(averagePing);
        }, this.PING_UPDATE_INTERVAL_MS);
    };

    updateStats = (stats) => {
        console.log(stats);
        this.stats = stats;
    };

    startGettingStats = () => {
        const messageHandler = (event) => {
            const { connectivityInfoMsg } = this.decodeMessage(event.data);
            if (connectivityInfoMsg) {
                this.updateStats(connectivityInfoMsg);
            }
        };

        websocketApi.onMessage(messageHandler);
    };

    getPing = () => this.ping;

    getStats = () => this.stats;
}

const stats = new Stats();

export default stats;
