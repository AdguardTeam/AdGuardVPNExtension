import { WsConnectivityMsg, WsPingMsg } from './protobufCompiled';
import { stringToUint8Array } from '../../lib/string-utils';
import log from '../../lib/logger';

/**
 * Prepares ping message before sending to the endpoint via websocket
 * @param {number} currentTime
 * @param {string} vpnToken
 * @param {string} appId
 * @returns {Uint8Array}
 */
const preparePingMessage = (currentTime, vpnToken, appId) => {
    const pingMsg = WsPingMsg.create({
        requestTime: currentTime,
        token: stringToUint8Array(vpnToken),
        applicationId: stringToUint8Array(appId),
        ignoredHandshake: false, // previously was used to ignore handshakes for measuring pings
    });
    const protocolMsg = WsConnectivityMsg.create({ pingMsg });
    return WsConnectivityMsg.encode(protocolMsg).finish();
};

const decodeMessage = (arrBufMessage) => {
    const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
    return WsConnectivityMsg.toObject(message);
};

/**
 * Sends ping message and returns latency
 * @param websocket
 * @param {string} vpnToken
 * @param {string} appId
 * @returns {Promise<number>}
 */
export const sendPingMessage = (websocket, vpnToken, appId) => {
    const PING_TIMEOUT_MS = 3000;
    const arrBufMessage = preparePingMessage(Date.now(), vpnToken, appId);

    return new Promise((resolve, reject) => {
        websocket.send(arrBufMessage);

        const timeoutId = setTimeout(() => {
            reject(new Error('Ping poll timeout'));
        }, PING_TIMEOUT_MS);

        const messageHandler = (event) => {
            const receivedTime = Date.now();
            const { pingMsg } = decodeMessage(event.data);
            if (pingMsg) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                websocket.removeEventListener('message', messageHandler);
                clearTimeout(timeoutId);
                resolve(ping);
            }
        };

        websocket.addEventListener('message', messageHandler);
    });
};

/**
 * Determines ping to the endpoint
 * @param domainName
 * @returns {Promise<number>}
 */
export const measurePingToEndpointViaFetch = async (domainName) => {
    const requestUrl = `https://ping.${domainName}/`;

    let ping;
    const POLLS_NUMBER = 3;

    for (let i = 0; i < POLLS_NUMBER; i += 1) {
        const start = Date.now();
        try {
            // eslint-disable-next-line no-await-in-loop
            await fetch(new Request(requestUrl, { redirect: 'manual' }));
            const fetchPing = Date.now() - start;
            if (!ping || fetchPing < ping) {
                ping = fetchPing;
            }
        } catch (e) {
            log.error(`Was unable to get ping to ${requestUrl} due to ${e}`);
        }
    }

    return ping;
};
