// connectivity.proto will be converted to js object by webpack
// https://github.com/protobufjs/protobuf.js#using-generated-static-code
// see webpack proto-loader https://github.com/PermissionData/protobufjs-loader
import { WsConnectivityMsg, WsPingMsg } from './connectivity.proto';
import wsFactory from '../api/websocketApi';
import { WS_API_URL_TEMPLATE } from '../config';
import { renderTemplate, stringToUint8Array } from '../../lib/string-utils';
import statsStorage from './statsStorage';
import credentials from '../credentials';
import notifier from '../../lib/notifier';
import { proxy } from '../proxy';

const CONNECTIVITY_STATE = {
    WORKING: 'working',
    PAUSED: 'paused',
};

class Connectivity {
    PING_UPDATE_INTERVAL_MS = 1000 * 60;

    constructor() {
        this.state = CONNECTIVITY_STATE.PAUSED;
        notifier.addSpecifiedListener(notifier.types.CREDENTIALS_UPDATED, this.updateCredentials);
    }

    updateCredentials = async () => {
        let vpnToken;
        let prefix;
        try {
            const accessCredentials = await credentials.getAccessCredentials();
            ({ prefix, token: vpnToken } = accessCredentials);
        } catch (e) {
            // do nothing;
            return;
        }

        const domainName = await proxy.getDomainName();

        // if values are empty, do nothing
        if (!vpnToken || !prefix || !domainName) {
            return;
        }

        const wsHost = `${prefix}.${domainName}`;

        // do not set if credentials are the same
        if (wsHost === this.wsHost
            && domainName === this.domainName
            && vpnToken === this.vpnToken) {
            return;
        }

        await this.setCredentials(wsHost, domainName, vpnToken);
    };

    async setCredentials(wsHost, domainName, vpnToken, shouldStart) {
        this.vpnToken = vpnToken;
        this.domainName = domainName;
        this.wsHost = wsHost;

        let restart = false;

        if (this.state === CONNECTIVITY_STATE.WORKING) {
            restart = true;
            await this.stop();
        }

        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host: wsHost });
        try {
            this.ws = await wsFactory.getWebsocket(websocketUrl);
        } catch (e) {
            this.state = CONNECTIVITY_STATE.PAUSED;
            throw new Error(`Failed to create new websocket because of: ${JSON.stringify(e.message)}`);
        }

        if (restart || shouldStart) {
            await this.start();
        }
    }

    start = async () => {
        if (this.state !== CONNECTIVITY_STATE.WORKING) {
            await this.ws.open();
            this.state = CONNECTIVITY_STATE.WORKING;
        }
        this.startGettingPing();
        this.startGettingConnectivityInfo();
        // when first ping received we can connect to proxy
        const averagePing = await this.getAveragePing();
        this.updatePingValue(averagePing);
        return averagePing;
    };

    stop = async () => {
        if (this.pingGetInterval) {
            clearInterval(this.pingGetInterval);
        }

        this.ping = null;

        if (this.ws) {
            await this.ws.close();
        }

        this.state = CONNECTIVITY_STATE.PAUSED;
    };

    preparePingMessage = (currentTime) => {
        const pingMsg = WsPingMsg.create({
            requestTime: currentTime,
            token: stringToUint8Array(this.vpnToken),
            applicationId: stringToUint8Array(credentials.getAppId()),
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
            const { pingMsg } = this.decodeMessage(event.data);
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                this.ws.removeMessageListener(messageHandler);
                resolve(ping);
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
        this.ping = ping;
    };

    startGettingPing = async () => {
        if (this.pingGetInterval) {
            clearInterval(this.pingGetInterval);
        }
        this.pingGetInterval = setInterval(async () => {
            const averagePing = await this.getAveragePing();
            this.updatePingValue(averagePing);
        }, this.PING_UPDATE_INTERVAL_MS);
    };

    updateConnectivityInfo = async (stats) => {
        const { bytesDownloaded = 0, bytesUploaded = 0 } = stats;

        await statsStorage.saveStats(this.domainName, {
            downloaded: bytesDownloaded,
            uploaded: bytesUploaded,
        });
    };

    handleErrorMsg = (connectivityErrorMsg) => {
        const NON_ROUTABLE_CODE = 'NON_ROUTABLE';

        const { code, payload } = connectivityErrorMsg;

        if (code === NON_ROUTABLE_CODE) {
            notifier.notifyListeners(notifier.types.ADD_NON_ROUTABLE_DOMAIN, payload);
        }
    };

    startGettingConnectivityInfo = async () => {
        const messageHandler = async (event) => {
            const { connectivityInfoMsg, connectivityErrorMsg } = this.decodeMessage(event.data);

            if (connectivityInfoMsg) {
                await this.updateConnectivityInfo(connectivityInfoMsg);
            }

            if (connectivityErrorMsg) {
                this.handleErrorMsg(connectivityErrorMsg);
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

    getStats = async () => {
        if (this.state === CONNECTIVITY_STATE.PAUSED) {
            return null;
        }
        const stats = await statsStorage.getStats(this.domainName);
        return { bytesDownloaded: stats.downloaded, bytesUploaded: stats.uploaded };
    };
}

const connectivity = new Connectivity();

export default connectivity;
