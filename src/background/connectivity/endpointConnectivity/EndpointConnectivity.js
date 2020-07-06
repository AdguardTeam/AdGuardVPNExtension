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
import { sendPingMessage } from '../pingHelpers';
import webrtc from '../../browserApi/webrtc';
import { EVENT } from '../connectivityService/connectivityConstants';
import { connectivityService } from '../connectivityService/connectivityFSM';

class EndpointConnectivity {
    // PING_SEND_INTERVAL_MS = 1000 * 60; TODO uncomment
    PING_SEND_INTERVAL_MS = 1000 * 5; // TODO delete

    /**
     * If WS didn't connect in this time, stop connection
     * @type {number}
     */
    CONNECTION_TIMEOUT_MS = 4000;

    /**
     * Used to stop WS connection if it takes too much time
     * @type {null|number}
     */
    connectionTimeout = null;

    constructor() {
        notifier.addSpecifiedListener(notifier.types.CREDENTIALS_UPDATED, this.updateCredentials);
        notifier.addSpecifiedListener(notifier.types.DNS_SERVER_SET, this.sendDnsServerIp);
    }

    updateCredentials = async () => {
        let vpnToken;
        let credentialsHash;
        try {
            const accessCredentials = await credentials.getAccessCredentials();
            ({ credentialsHash, token: vpnToken } = accessCredentials);
        } catch (e) {
            return; // do nothing;
        }

        const domainName = await proxy.getDomainName();

        // if values are empty, do nothing
        if (!vpnToken || !credentialsHash || !domainName) {
            return;
        }

        // do not set if credentials are the same
        if (this.credentialsHash === credentialsHash
            && this.domainName === domainName
            && this.vpnToken === vpnToken) {
            return;
        }

        await this.setCredentials(domainName, vpnToken, credentialsHash);
    };

    setCredentials(domainName, vpnToken, credentialsHash) {
        this.vpnToken = vpnToken;
        this.domainName = domainName;
        this.credentialsHash = credentialsHash;

        let restart = false;

        if (this.ws && (this.ws.readyState === this.ws.OPEN
            || this.ws.readyState === this.ws.CONNECTING)) {
            restart = true;
            this.stop();
        }

        if (restart) {
            this.start();
        }
    }

    /**
     * Handles WebSocket close events
     * @param closeEvent
     * @returns {Promise<void>}
     */
    handleWebsocketClose = async (closeEvent) => {
        log.debug('WS closed:', closeEvent);

        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();

        connectivityService.send(EVENT.WS_CLOSE);
    }

    handleWebsocketOpen = async () => {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        log.debug('WS connected to:', this.ws.url);
        this.startGettingConnectivityInfo();

        // when first ping received we can connect to proxy
        const averagePing = await this.sendPingMessage();
        if (!averagePing) {
            log.error('Was unable to send ping message');
            connectivityService.send(EVENT.CONNECTION_FAIL);
            return;
        }

        this.sendDnsServerIp(dns.getDnsServerIp());
        this.startSendingPingMessages();

        // connect to the proxy and turn on webrtc
        await proxy.turnOn(); // TODO check case when other extension is blocking connection
        webrtc.blockWebRTC();
        connectivityService.send(EVENT.CONNECTION_SUCCESS);
    }

    /**
     * Handles WS errors
     */
    handleWebsocketError = async (errorEvent) => {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        log.debug('WS threw an error: ', errorEvent);

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
        connectivityService.send(EVENT.WS_ERROR);
    }

    isWebsocketConnectionOpen = () => {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        }
        return false;
    }

    start = () => {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }

        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, {
            host: `hello.${this.domainName}`,
            hash: this.credentialsHash,
        });

        this.ws = websocketFactory.createWebsocket(websocketUrl);

        this.ws.addEventListener('close', this.handleWebsocketClose);
        this.ws.addEventListener('error', this.handleWebsocketError);
        this.ws.addEventListener('open', this.handleWebsocketOpen);

        this.connectionTimeout = setTimeout(() => {
            log.debug(`WS did not connected in ${this.CONNECTION_TIMEOUT_MS}, closing it`);
            this.ws.close();
        }, this.CONNECTION_TIMEOUT_MS);
    };

    stop = async () => {
        if (this.pingSendIntervalId) {
            clearInterval(this.pingSendIntervalId);
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();

        if (this.ws) {
            this.ws.removeEventListener('close', this.handleWebsocketClose);
            this.ws.removeEventListener('error', this.handleWebsocketError);
            this.ws.removeEventListener('open', this.handleWebsocketOpen);
            this.ws.close();
        }
    };

    decodeMessage = (arrBufMessage) => {
        const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
        return WsConnectivityMsg.toObject(message);
    };

    /**
     * Ping messages are used in backend in order to determine sessions start,
     * getting stats and keeping ws alive
     * @returns {Promise<null|number>}
     */
    sendPingMessage = async () => {
        const appId = credentials.getAppId();
        return sendPingMessage(this.ws, this.vpnToken, appId);
    };

    startSendingPingMessages = () => {
        if (this.pingSendIntervalId) {
            clearInterval(this.pingSendIntervalId);
        }
        this.pingSendIntervalId = setInterval(async () => {
            try {
                await this.sendPingMessage();
            } catch (e) {
                log.debug(e.message);
            }
        }, this.PING_SEND_INTERVAL_MS);
    };

    prepareDnsSettingsMessage = (dnsIp) => {
        const settingsMsg = WsSettingsMsg.create({ dnsServer: dnsIp });
        const protocolMsg = WsConnectivityMsg.create({ settingsMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    sendDnsServerIp = (dnsIp) => {
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

    startGettingConnectivityInfo = () => {
        const messageHandler = async (event) => {
            console.log(this.decodeMessage(event.data));
            const { connectivityInfoMsg, connectivityErrorMsg } = this.decodeMessage(event.data);

            if (connectivityInfoMsg) {
                await this.handleInfoMsg(connectivityInfoMsg);
            }

            if (connectivityErrorMsg) {
                this.handleErrorMsg(connectivityErrorMsg);
            }
        };

        this.ws.addEventListener('message', messageHandler);
    };

    getStats = async () => {
        if (this.ws && this.ws.readyState !== this.ws.OPEN) {
            return null;
        }
        const stats = await statsStorage.getStats(this.domainName);
        return { bytesDownloaded: stats.downloaded, bytesUploaded: stats.uploaded };
    };
}

export default EndpointConnectivity;
