import { WsConnectivityMsg, WsPingMsg } from './protobufCompiled';
import { stringToUint8Array } from '../../lib/string-utils';
import log from '../../lib/logger';
import { identity } from '../../lib/helpers';

/**
 * Prepares ping message before sending to the endpoint via websocket
 * @param {number} currentTime
 * @param {string} vpnToken
 * @param {string} appId
 * @param {boolean} ignoredHandshake - flag if we should ignore handshake or not.
 * Ping measurement should ignoreHandshake
 * @returns {Uint8Array}
 */
const preparePingMessage = (currentTime, vpnToken, appId, ignoredHandshake) => {
    const pingMsg = WsPingMsg.create({
        requestTime: currentTime,
        token: stringToUint8Array(vpnToken),
        applicationId: stringToUint8Array(appId),
        ignoredHandshake,
    });
    const protocolMsg = WsConnectivityMsg.create({ pingMsg });
    return WsConnectivityMsg.encode(protocolMsg).finish();
};

const decodeMessage = (arrBufMessage) => {
    const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
    return WsConnectivityMsg.toObject(message);
};

// eslint-disable-next-line max-len
const pollPing = (websocket, vpnToken, appId, ignoredHandshake) => new Promise((resolve, reject) => {
    const POLL_TIMEOUT_MS = 3000;
    const arrBufMessage = preparePingMessage(Date.now(), vpnToken, appId, ignoredHandshake);
    websocket.send(arrBufMessage);

    const timeoutId = setTimeout(reject, POLL_TIMEOUT_MS);

    const messageHandler = (event) => {
        const receivedTime = Date.now();
        const { pingMsg } = decodeMessage(event.data);
        if (pingMsg) {
            const { requestTime } = pingMsg;
            const ping = receivedTime - requestTime;
            websocket.removeMessageListener(messageHandler);
            clearTimeout(timeoutId);
            resolve(ping);
        }
    };

    websocket.onMessage(messageHandler);
});

/**
 * Returns minimal ping to websocket after making 3 sequential ping requests
 * @param websocket
 * @param vpnToken
 * @param appId
 * @param ignoredHandshake
 * @returns {Promise<null|number>}
 */
export const determinePing = async (websocket, vpnToken, appId, ignoredHandshake = true) => {
    const POLLS_NUM = 3;
    const results = [];

    try {
        for (let i = 0; i < POLLS_NUM; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const result = await pollPing(websocket, vpnToken, appId, ignoredHandshake);
            results.push(result);
        }
    } catch (e) {
        log.info(`Occurred error while getting ping for "${websocket.url}" `, e.message);
        return null;
    }

    const filteredResults = results.filter(identity);
    if (filteredResults.length > 0) {
        return Math.min(...results);
    }

    return null;
};
