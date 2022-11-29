import { WsConnectivityMsg, WsSettingsMsg } from '../protobufCompiled';
import websocketFactory from '../websocket/websocketFactory';
import { WS_API_URL_TEMPLATE } from '../../config';
import { renderTemplate } from '../../../lib/string-utils';
import { notifier } from '../../../lib/notifier';
import { proxy } from '../../proxy';
import { log } from '../../../lib/logger';
import { dns } from '../../dns';
import { sendPingMessage } from '../pingHelpers';
import webrtc from '../../browserApi/webrtc';
import { EVENT, MIN_CONNECTION_DURATION_MS } from '../connectivityService/connectivityConstants';
import { sleepIfNecessary } from '../../../lib/helpers';
// eslint-disable-next-line import/no-cycle
import { connectivityService } from '../connectivityService/connectivityFSM';
// eslint-disable-next-line import/no-cycle
import credentials from '../../credentials';
import { notifications } from '../../notifications';
import { translator } from '../../../common/translator';

class EndpointConnectivity {
    PING_SEND_INTERVAL_MS = 1000 * 60;

    /**
     * If WS didn't connect in this time, stop connection
     * @type {number}
     */
    CONNECTION_TIMEOUT_MS = 4000;

    /**
     * Used to clear timeout function if WS connection succeeded
     * or failed faster than connection timeout fired
     * @type {null|number}
     */
    connectionTimeoutId = null;

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

        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();

        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(EVENT.WS_CLOSE);
    };

    handleWebsocketOpen = async () => {
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        log.debug('WS connected to:', this.ws.url);
        this.startGettingConnectivityInfo();

        // when first ping received we can connect to proxy
        const averagePing = await this.sendPingMessage();
        if (!averagePing) {
            log.error('Was unable to send ping message');
            await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
            connectivityService.send(EVENT.CONNECTION_FAIL);
            return;
        }

        this.sendDnsServerIp(dns.getCurrentDnsServerAddress());
        this.startSendingPingMessages();

        try {
            await proxy.turnOn();
        } catch (e) {
            // we can't connect to the proxy because other extensions are controlling it
            // stop trying to connect
            connectivityService.send(EVENT.PROXY_CONNECTION_ERROR);
            log.error('Error occurred on proxy turn on:', e.message);
            return;
        }
        webrtc.blockWebRTC();
        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(EVENT.CONNECTION_SUCCESS);
    };

    /**
     * Handles WS errors
     */
    handleWebsocketError = async (errorEvent) => {
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        log.debug('WS threw an error: ', errorEvent);

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(EVENT.WS_ERROR);
    };

    isWebsocketConnectionOpen = () => {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        }
        return false;
    };

    start = (entryTime) => {
        this.entryTime = entryTime;

        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, {
            host: `hello.${this.domainName}`,
            hash: this.credentialsHash,
        });

        this.ws = websocketFactory.createWebsocket(websocketUrl);

        this.ws.onclose(this.handleWebsocketClose);
        // this.ws.addEventListener('close', this.handleWebsocketClose);
        this.ws.onerror(this.handleWebsocketError);
        // this.ws.addEventListener('error', this.handleWebsocketError);
        this.ws.onopen(this.handleWebsocketOpen);
        // this.ws.addEventListener('open', this.handleWebsocketOpen);

        this.connectionTimeoutId = setTimeout(() => {
            log.debug(`WS did not connected in ${this.CONNECTION_TIMEOUT_MS}, closing it`);
            this.ws.close();
        }, this.CONNECTION_TIMEOUT_MS);
    };

    stop = async () => {
        if (this.pingSendIntervalId) {
            clearInterval(this.pingSendIntervalId);
        }

        if (this.ws) {
            // this.ws.removeEventListener('close', this.handleWebsocketClose);
            // this.ws.removeEventListener('error', this.handleWebsocketError);
            // this.ws.removeEventListener('open', this.handleWebsocketOpen);
            this.ws.close();
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
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
        const appId = await credentials.getAppId();
        try {
            const ping = await sendPingMessage(this.ws, this.vpnToken, appId);
            return ping;
        } catch (e) {
            log.debug(e);
            return null;
        }
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
        if (!this.ws) {
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
        const { refreshTokens } = infoMsg;

        if (refreshTokens) {
            notifier.notifyListeners(notifier.types.SHOULD_REFRESH_TOKENS);
        }
    };

    handleErrorMsg = async (connectivityErrorMsg) => {
        const NON_ROUTABLE_CODE = 'NON_ROUTABLE';
        const TOO_MANY_DEVICES_CONNECTED = 'TOO_MANY_DEVICES_CONNECTED';
        const TRAFFIC_LIMIT_REACHED = 'TRAFFIC_LIMIT_REACHED';
        const FREE_TRAFFIC_LEFT_MEGABYTES = 'FREE_TRAFFIC_LEFT_MEGABYTES';

        const { code, payload } = connectivityErrorMsg;

        if (code === NON_ROUTABLE_CODE) {
            notifier.notifyListeners(notifier.types.NON_ROUTABLE_DOMAIN_FOUND, payload);
        }
        if (code === TOO_MANY_DEVICES_CONNECTED) {
            notifier.notifyListeners(notifier.types.TOO_MANY_DEVICES_CONNECTED, payload);
            connectivityService.send(EVENT.TOO_MANY_DEVICES_CONNECTED);
        }
        if (code === TRAFFIC_LIMIT_REACHED) {
            await notifications.create({
                title: translator.getMessage('notification_data_limit_reached_title'),
                message: translator.getMessage('notification_data_limit_reached_description'),
            });
        }
        if (code === FREE_TRAFFIC_LEFT_MEGABYTES) {
            await notifications.create({
                title: translator.getMessage('notification_data_left_mb', { num: payload }),
                message: translator.getMessage('notification_data_left_description'),
            });
        }
    };

    startGettingConnectivityInfo = () => {
        // const messageHandler = async (event) => {
        //     const { connectivityInfoMsg, connectivityErrorMsg } = this.decodeMessage(event.data);
        //
        //     if (connectivityInfoMsg) {
        //         await this.handleInfoMsg(connectivityInfoMsg);
        //     }
        //
        //     if (connectivityErrorMsg) {
        //         await this.handleErrorMsg(connectivityErrorMsg);
        //     }
        // };

        // this.ws.addEventListener('message', messageHandler);
    };
}

export default EndpointConnectivity;
