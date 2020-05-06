import { WsConnectivityMsg, WsPingMsg, WsSettingsMsg } from '../protobufCompiled';
import websocketFactory from '../websocket/websocketFactory';
import { WS_API_URL_TEMPLATE } from '../../config';
import { renderTemplate, stringToUint8Array } from '../../../lib/string-utils';
import statsStorage from '../statsStorage';
import notifier from '../../../lib/notifier';
import proxy from '../../proxy';
import credentials from '../../credentials';
import log from '../../../lib/logger';
import dns from '../../dns/dns';

class EndpointConnectivity {
    PING_UPDATE_INTERVAL_MS = 1000 * 60;

    CONNECTION_STATES = {
        WORKING: 'working',
        PAUSED: 'paused',
    };

    constructor() {
        this.state = this.CONNECTION_STATES.PAUSED;
        notifier.addSpecifiedListener(notifier.types.CREDENTIALS_UPDATED, this.updateCredentials);
        notifier.addSpecifiedListener(notifier.types.DNS_SERVER_SET, this.sendDnsServerIp);
    }

    updateCredentials = async () => {
        let vpnToken;
        let prefix;
        try {
            const accessCredentials = await credentials.getAccessCredentials();
            ({ prefix, token: vpnToken } = accessCredentials);
        } catch (e) {
            return; // do nothing;
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

        if (this.state === this.CONNECTION_STATES.WORKING) {
            restart = true;
            await this.stop();
        }

        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host: wsHost });
        try {
            this.ws = await websocketFactory.createReconnectingWebsocket(websocketUrl);
        } catch (e) {
            this.state = this.CONNECTION_STATES.PAUSED;
            throw new Error(`Failed to create new websocket because of: ${JSON.stringify(e.message)}`);
        }

        if (restart || shouldStart) {
            await this.start();
        }
    }

    handleWebsocketClose = () => {
        notifier.notifyListeners(notifier.types.WEBSOCKET_CLOSED);
    }

    start = async () => {
        if (this.state !== this.CONNECTION_STATES.WORKING) {
            await this.ws.open();
            this.state = this.CONNECTION_STATES.WORKING;
        }
        this.ws.addEventListener('close', this.handleWebsocketClose);
        this.startGettingPing();
        this.startGettingConnectivityInfo();
        this.sendDnsServerIp(dns.getDnsServerIp());
        // when first ping received we can connect to proxy
        const averagePing = await this.calculateAveragePing();
        this.updatePingValue(averagePing);
        return averagePing;
    };

    stop = async () => {
        if (this.pingGetInterval) {
            clearInterval(this.pingGetInterval);
        }

        this.ping = null;

        if (this.ws) {
            this.ws.removeEventListener('close', this.handleWebsocketClose);
            await this.ws.close();
        }

        this.state = this.CONNECTION_STATES.PAUSED;
    };

    preparePingMessage = (currentTime) => {
        const pingMsg = WsPingMsg.create({
            requestTime: currentTime,
            token: stringToUint8Array(this.vpnToken),
            applicationId: stringToUint8Array(credentials.getAppId()),
            // selected endpoint shouldn't ignore handshake, ignore only for ping measurement
            ignoredHandshake: false,
        });
        const protocolMsg = WsConnectivityMsg.create({ pingMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    decodeMessage = (arrBufMessage) => {
        const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
        return WsConnectivityMsg.toObject(message);
    };

    pollPing = () => new Promise((resolve, reject) => {
        const POLL_PING_TIMEOUT_MS = 5000;
        const arrBufMessage = this.preparePingMessage(Date.now());
        this.ws.send(arrBufMessage);

        let timeoutId;
        const messageHandler = (event) => {
            const receivedTime = Date.now();
            const { pingMsg } = this.decodeMessage(event.data);
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                this.ws.removeEventListener('message', messageHandler);
                clearTimeout(timeoutId);
                resolve(ping);
            }
        };

        timeoutId = setTimeout(() => {
            this.ws.removeEventListener('message', messageHandler);
            reject(new Error('Poll ping timeout'));
        }, POLL_PING_TIMEOUT_MS);

        this.ws.addEventListener('message', messageHandler);
    });

    calculateAveragePing = async () => {
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
            try {
                const averagePing = await this.calculateAveragePing();
                this.updatePingValue(averagePing);
            } catch (e) {
                // ignore
            }
        }, this.PING_UPDATE_INTERVAL_MS);
    };

    prepareDnsSettingsMessage = (dnsIp) => {
        const settingsMsg = WsSettingsMsg.create({ dnsServer: dnsIp });
        const protocolMsg = WsConnectivityMsg.create({ settingsMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    sendDnsServerIp = (dnsIp) => {
        if (this.state !== this.CONNECTION_STATES.WORKING) {
            return;
        }
        const arrBufMessage = this.prepareDnsSettingsMessage(dnsIp);
        this.ws.send(arrBufMessage);
        log.debug(`DNS settings sent. DNS IP: ${dnsIp}`);
    };

    /**
     * Handles info message, updates stats or sends message to update tokens
     * @param infoMsg
     * @returns {Promise<void>}
     */
    handleInfoMsg = async (infoMsg) => {
        const { bytesDownloaded = 0, bytesUploaded = 0, refreshTokens } = infoMsg;

        if (bytesUploaded || bytesDownloaded) {
            await statsStorage.saveStats(this.domainName, {
                downloaded: bytesDownloaded,
                uploaded: bytesUploaded,
            });
        }

        if (refreshTokens) {
            notifier.notifyListeners(notifier.types.SHOULD_REFRESH_TOKENS);
        }
    };

    handleErrorMsg = (connectivityErrorMsg) => {
        const NON_ROUTABLE_CODE = 'NON_ROUTABLE';

        const { code, payload } = connectivityErrorMsg;

        if (code === NON_ROUTABLE_CODE) {
            notifier.notifyListeners(notifier.types.NON_ROUTABLE_DOMAIN_FOUND, payload);
        }
    };

    startGettingConnectivityInfo = async () => {
        const messageHandler = async (event) => {
            const { connectivityInfoMsg, connectivityErrorMsg } = this.decodeMessage(event.data);

            if (connectivityInfoMsg) {
                await this.handleInfoMsg(connectivityInfoMsg);
            }

            if (connectivityErrorMsg) {
                this.handleErrorMsg(connectivityErrorMsg);
            }
        };

        this.ws.addEventListener(messageHandler);
    };

    getPing = () => {
        if (!this.ping || this.state === this.CONNECTION_STATES.PAUSED) {
            return null;
        }
        return this.ping;
    };

    getStats = async () => {
        if (this.state === this.CONNECTION_STATES.PAUSED) {
            return null;
        }
        const stats = await statsStorage.getStats(this.domainName);
        return { bytesDownloaded: stats.downloaded, bytesUploaded: stats.uploaded };
    };
}

export default EndpointConnectivity;
