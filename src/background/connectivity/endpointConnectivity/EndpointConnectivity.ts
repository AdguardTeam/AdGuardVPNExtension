import { WsConnectivityMsg, WsSettingsMsg } from '../protobufCompiled';
import { websocketFactory } from '../websocket';
import { WS_API_URL_TEMPLATE } from '../../config';
import { renderTemplate } from '../../../lib/string-utils';
import { notifier } from '../../../lib/notifier';
import { proxy } from '../../proxy';
import { log } from '../../../lib/logger';
import { dns } from '../../dns';
import { sendPingMessage } from '../pingHelpers';
import { webrtc } from '../../browserApi/webrtc';
import { sleepIfNecessary } from '../../../lib/helpers';
import {
    connectivityService,
    ConnectivityEventType,
    MIN_CONNECTION_DURATION_MS,
} from '../connectivityService';
// eslint-disable-next-line import/no-cycle
import { credentials } from '../../credentials';
import { notifications } from '../../notifications';
import { translator } from '../../../common/translator';

interface EndpointConnectivityInterface {
    setCredentials(domainName: string, vpnToken: string, credentialsHash: string): void;
    isWebsocketConnectionOpen(): boolean;
    start(entryTime?: number): void;
    stop(): Promise<void>;
}

/**
 * Error codes from backend
 */
enum ErrorCode {
    NonRoutableCode = 'NON_ROUTABLE',
    TooManyDevicesConnected = 'TOO_MANY_DEVICES_CONNECTED',
    TrafficLimitReached = 'TRAFFIC_LIMIT_REACHED',
    FreeTrafficLeftMegabytes = 'FREE_TRAFFIC_LEFT_MEGABYTES',
}

export class EndpointConnectivity implements EndpointConnectivityInterface {
    PING_SEND_INTERVAL_MS = 1000 * 60;

    /**
     * If WS didn't connect in this time, stop connection
     */
    CONNECTION_TIMEOUT_MS = 4000;

    /**
     * Used to clear timeout function if WS connection succeeded
     * or failed faster than connection timeout fired
     */
    connectionTimeoutId: ReturnType<typeof setInterval> | null = null;

    private credentialsHash: string;

    private domainName: string;

    private vpnToken: string;

    private ws: WebSocket;

    private entryTime: number;

    private pingSendIntervalId: ReturnType<typeof setInterval>;

    constructor() {
        notifier.addSpecifiedListener(notifier.types.CREDENTIALS_UPDATED, this.updateCredentials);
        notifier.addSpecifiedListener(notifier.types.DNS_SERVER_SET, this.sendDnsServerIp);
    }

    updateCredentials = async (): Promise<void> => {
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

    setCredentials(domainName: string, vpnToken: string, credentialsHash: string): void {
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
     */
    handleWebsocketClose = async (closeEvent: WebSocketEventMap['close']): Promise<void> => {
        log.debug('WS closed:', closeEvent);

        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();

        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(ConnectivityEventType.WsClose);
    };

    handleWebsocketOpen = async (): Promise<void> => {
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
            connectivityService.send(ConnectivityEventType.ConnectionFail);
            return;
        }

        this.sendDnsServerIp(dns.getCurrentDnsServerAddress());
        this.startSendingPingMessages();

        try {
            await proxy.turnOn();
        } catch (e) {
            // we can't connect to the proxy because other extensions are controlling it
            // stop trying to connect
            connectivityService.send(ConnectivityEventType.ProxyConnectionError);
            log.error('Error occurred on proxy turn on:', e.message);
            return;
        }
        webrtc.blockWebRTC();
        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(ConnectivityEventType.ConnectionSuccess);
    };

    /**
     * Handles WS errors
     */
    handleWebsocketError = async (errorEvent: WebSocketEventMap['error']): Promise<void> => {
        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        log.debug('WS threw an error: ', errorEvent);

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
        await sleepIfNecessary(this.entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(ConnectivityEventType.WsError);
    };

    isWebsocketConnectionOpen = (): boolean => {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        }
        return false;
    };

    start = (entryTime?: number): void => {
        if (entryTime) {
            this.entryTime = entryTime;
        }

        if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
        }

        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, {
            host: this.domainName,
            hash: this.credentialsHash,
        });

        this.ws = websocketFactory.createWebsocket(websocketUrl);

        this.ws.addEventListener('close', this.handleWebsocketClose);
        this.ws.addEventListener('error', this.handleWebsocketError);
        this.ws.addEventListener('open', this.handleWebsocketOpen);

        this.connectionTimeoutId = setTimeout(() => {
            log.debug(`WS did not connected in ${this.CONNECTION_TIMEOUT_MS}, closing it`);
            this.ws.close();
        }, this.CONNECTION_TIMEOUT_MS);
    };

    stop = async (): Promise<void> => {
        if (this.pingSendIntervalId) {
            clearInterval(this.pingSendIntervalId);
        }

        if (this.ws) {
            this.ws.removeEventListener('close', this.handleWebsocketClose);
            this.ws.removeEventListener('error', this.handleWebsocketError);
            this.ws.removeEventListener('open', this.handleWebsocketOpen);
            this.ws.close();
        }

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
    };

    decodeMessage = (arrBufMessage: ArrayBuffer) => {
        const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
        return WsConnectivityMsg.toObject(message);
    };

    /**
     * Ping messages are used in backend in order to determine sessions start,
     * getting stats and keeping ws alive
     */
    sendPingMessage = async (): Promise<number | null> => {
        const appId = await credentials.getAppId();
        try {
            const ping = await sendPingMessage(this.ws, this.vpnToken, appId);
            return ping;
        } catch (e) {
            log.debug(e);
            return null;
        }
    };

    startSendingPingMessages = (): void => {
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

    prepareDnsSettingsMessage = (dnsIp: string): ArrayBuffer => {
        const settingsMsg = WsSettingsMsg.create({ dnsServer: dnsIp });
        const protocolMsg = WsConnectivityMsg.create({ settingsMsg });
        return WsConnectivityMsg.encode(protocolMsg).finish();
    };

    sendDnsServerIp = (dnsIp: string): void => {
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
     */
    handleInfoMsg = async (infoMsg : { refreshTokens: boolean }): Promise<void> => {
        const { refreshTokens } = infoMsg;

        if (refreshTokens) {
            notifier.notifyListeners(notifier.types.SHOULD_REFRESH_TOKENS);
        }
    };

    handleErrorMsg = async (connectivityErrorMsg: { code: string, payload: number }): Promise<void> => {
        const { code, payload } = connectivityErrorMsg;

        if (code === ErrorCode.NonRoutableCode) {
            notifier.notifyListeners(notifier.types.NON_ROUTABLE_DOMAIN_FOUND, payload);
        }
        if (code === ErrorCode.TooManyDevicesConnected) {
            notifier.notifyListeners(notifier.types.TOO_MANY_DEVICES_CONNECTED, payload);
            connectivityService.send(ConnectivityEventType.TooManyDevicesConnected);
        }
        if (code === ErrorCode.TrafficLimitReached) {
            await notifications.create({
                title: translator.getMessage('notification_data_limit_reached_title'),
                message: translator.getMessage('notification_data_limit_reached_description'),
            });
        }
        if (code === ErrorCode.FreeTrafficLeftMegabytes) {
            await notifications.create({
                title: translator.getMessage('notification_data_left_mb', { num: payload }),
                message: translator.getMessage('notification_data_left_description'),
            });
        }
    };

    startGettingConnectivityInfo = (): void => {
        const messageHandler = async (event: WebSocketEventMap['message']) => {
            const { connectivityInfoMsg, connectivityErrorMsg } = this.decodeMessage(event.data);

            if (connectivityInfoMsg) {
                await this.handleInfoMsg(connectivityInfoMsg);
            }

            if (connectivityErrorMsg) {
                await this.handleErrorMsg(connectivityErrorMsg);
            }
        };

        this.ws.addEventListener('message', messageHandler);
    };
}
