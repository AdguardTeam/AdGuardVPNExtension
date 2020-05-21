import { WsConnectivityMsg, WsSettingsMsg } from '../protobufCompiled';
import websocketFactory from '../websocket/websocketFactory';
import { WS_API_URL_TEMPLATE } from '../../config';
import { renderTemplate } from '../../../lib/string-utils';
import statsStorage from '../statsStorage';
import notifier from '../../../lib/notifier';
import proxy from '../../proxy';
import credentials from '../../credentials';
import log from '../../../lib/logger';
import dns from '../../dns/dns';
import { determinePing } from '../pingHelpers';

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
        this.state = this.CONNECTION_STATES.PAUSED;
        notifier.notifyListeners(notifier.types.WEBSOCKET_CLOSED);
    }

    isWebsocketConnectionOpen = () => {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        }
        return false;
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
        const averagePing = await this.determinePing();
        if (!averagePing) {
            throw new Error('Was unable to determine ping');
        }
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

    decodeMessage = (arrBufMessage) => {
        const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
        return WsConnectivityMsg.toObject(message);
    };

    determinePing = async () => {
        const appId = credentials.getAppId();
        const ping = await determinePing(this.ws, this.vpnToken, appId, false);
        return ping;
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
                const ping = await this.determinePing();
                this.updatePingValue(ping);
            } catch (e) {
                log.debug(e.message);
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
