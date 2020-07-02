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

class EndpointConnectivity {
    PING_SEND_INTERVAL_MS = 1000 * 60;

    CONNECTIVITY_STATES = {
        WORKING: 'working',
        PAUSED: 'paused',
    };

    constructor() {
        this.setState(this.CONNECTIVITY_STATES.PAUSED);
        notifier.addSpecifiedListener(notifier.types.CREDENTIALS_UPDATED, this.updateCredentials);
        notifier.addSpecifiedListener(notifier.types.DNS_SERVER_SET, this.sendDnsServerIp);
    }

    /**
     * Sets connectivity state and notifies popup
     * @param state
     */
    setState = (state) => {
        if (this.state === state) {
            return;
        }
        this.state = state;
    }

    isWorking = () => {
        return this.state === this.CONNECTIVITY_STATES.WORKING;
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

    async setCredentials(domainName, vpnToken, credentialsHash, shouldStart) {
        this.vpnToken = vpnToken;
        this.domainName = domainName;
        this.credentialsHash = credentialsHash;

        let restart = false;

        if (this.state === this.CONNECTIVITY_STATES.WORKING) {
            restart = true;
            await this.stop();
        }

        if (restart || shouldStart) {
            await this.start();
        }
    }

    handleWebsocketClose = async () => {
        this.setState(this.CONNECTIVITY_STATES.PAUSED);
        notifier.notifyListeners(notifier.types.WEBSOCKET_CLOSED);

        // disconnect proxy and turn off webrtc
        await proxy.turnOff();
        webrtc.unblockWebRTC();
    }

    lastErrorTime = Date.now();

    errorsStarted = null;

    triedReconnection = false;

    handleWebsocketOpen = async () => {
        this.errorsStarted = null;
        this.triedReconnection = false;

        this.startGettingConnectivityInfo();
        this.sendDnsServerIp(dns.getDnsServerIp());

        // when first ping received we can connect to proxy
        const averagePing = await this.sendPingMessage();
        if (!averagePing) {
            log.error('Was unable to send ping message');
            return;
        }

        this.startSendingPingMessages();

        // connect to the proxy and turn on webrtc
        await proxy.turnOn();
        webrtc.blockWebRTC();
    }

    /**
     * Handles errors which could occur when endpoints are removed
     * https://jira.adguard.com/browse/AG-2952
     */
    handleWebsocketError = () => {
        // If errors happen too rare we do not consider them
        const CONSIDERED_ERRORS_INTERVAL_MS = 20 * 1000;

        // After this period of time of errors we should try reconnect
        const RECONNECTION_TIMEOUT = 70 * 1000;

        const errorTime = Date.now();
        // reset to the current time
        if (!this.errorsStarted
            || (errorTime - this.lastErrorTime) > CONSIDERED_ERRORS_INTERVAL_MS) {
            this.errorsStarted = errorTime;
        }

        this.lastErrorTime = errorTime;

        log.debug('Since ws errors sequence started passed: ', (errorTime - this.errorsStarted) / 1000, 'seconds');

        if (errorTime - this.errorsStarted > RECONNECTION_TIMEOUT
            && this.ws.readyState !== this.ws.OPEN
            && !this.triedReconnection
        ) {
            log.debug('Was unable to connect to websocket more than 70 seconds');
            // This would refresh tokens and try to reconnect endpoint
            notifier.notifyListeners(notifier.types.SHOULD_REFRESH_TOKENS);
            this.triedReconnection = true;
        }
    }

    isWebsocketConnectionOpen = () => {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        }
        return false;
    }

    start = async () => {
        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, {
            host: `hello.${this.domainName}`,
            hash: this.credentialsHash,
        });

        this.ws = await websocketFactory.createReconnectingWebsocket(websocketUrl);

        this.ws.addEventListener('close', this.handleWebsocketClose);
        this.ws.addEventListener('error', this.handleWebsocketError);
        this.ws.addEventListener('open', this.handleWebsocketOpen);
    };

    stop = async () => {
        if (this.pingSendIntervalId) {
            clearInterval(this.pingSendIntervalId);
        }

        if (this.ws) {
            this.ws.close();
        }

        this.setState(this.CONNECTIVITY_STATES.PAUSED);
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
        if (this.state === this.CONNECTIVITY_STATES.PAUSED) {
            return null;
        }
        const stats = await statsStorage.getStats(this.domainName);
        return { bytesDownloaded: stats.downloaded, bytesUploaded: stats.uploaded };
    };
}

export default EndpointConnectivity;
