import { nanoid } from 'nanoid';

import { stringToUint8Array } from '../../common/utils/string';
import { log } from '../../common/logger';
import { sleep } from '../../common/helpers';

import { WsConnectivityMsg, WsPingMsg } from './protobufCompiled';

type PingMsgType = {
    requestTime: number | null;
    token: Uint8Array | null;
    applicationId: Uint8Array | null;
    ignoredHandshake: boolean | null;
};

/**
 * Prepares ping message before sending to the endpoint via websocket.
 *
 * @param currentTime
 * @param vpnToken
 * @param appId
 *
 * @returns Ping message.
 */
const preparePingMessage = (currentTime: number, vpnToken: string, appId: string): Uint8Array => {
    const pingMsg = WsPingMsg.create({
        requestTime: currentTime,
        token: stringToUint8Array(vpnToken),
        applicationId: stringToUint8Array(appId),
        ignoredHandshake: false, // previously was used to ignore handshakes for measuring pings
    });
    const protocolMsg = WsConnectivityMsg.create({ pingMsg });
    return WsConnectivityMsg.encode(protocolMsg).finish();
};

const decodeMessage = (arrBufMessage: ArrayBuffer): Record<string, unknown> => {
    const message = WsConnectivityMsg.decode(new Uint8Array(arrBufMessage));
    return WsConnectivityMsg.toObject(message);
};

/**
 * Sends ping message and returns latency
 *
 * @param websocket
 * @param vpnToken
 * @param appId
 *
 * @returns Promise with latency in ms.
 */
export const sendPingMessage = (websocket: WebSocket, vpnToken: string, appId: string): Promise<number> => {
    const PING_TIMEOUT_MS = 3000;
    const arrBufMessage = preparePingMessage(Date.now(), vpnToken, appId);

    return new Promise((resolve, reject) => {
        if (!websocket || websocket.readyState !== websocket.OPEN) {
            reject(new Error('WS is already closed'));
            return;
        }

        websocket.send(arrBufMessage);

        const timeoutId = setTimeout(() => {
            reject(new Error('Ping poll timeout'));
        }, PING_TIMEOUT_MS);

        const messageHandler = (event: MessageEvent): void => {
            const receivedTime = Date.now();
            const { pingMsg } = decodeMessage(event.data) as { pingMsg: PingMsgType };
            if (pingMsg && pingMsg.requestTime) {
                const { requestTime } = pingMsg;
                const ping = receivedTime - requestTime;
                if (ping > PING_TIMEOUT_MS) {
                    // ping over 3s should be ignored,
                    // because the websocket response seems to be too old
                    reject(new Error('Ping is too long'));
                }
                websocket.removeEventListener('message', messageHandler);
                clearTimeout(timeoutId);
                resolve(ping);
            }
        };

        websocket.addEventListener('message', messageHandler);
    });
};

/**
 * Makes fetch request with timeout and aborts it in the case of timeout.
 *
 * @param requestUrl
 * @param fetchTimeout
 *
 * @returns Promise with fetch response.
 */
const fetchWithTimeout = (requestUrl: string, fetchTimeout: number): Promise<unknown> => {
    const RANDOM_PARAM_LENGTH = 6;
    // we add random search param to avoid caching
    const requestUrlWithRandomParams = `${requestUrl}?r=${nanoid(RANDOM_PARAM_LENGTH)}`;

    // used to abort going fetch requests
    const controller = new AbortController();

    // used in order to clear timeout
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchHandler = async (): Promise<Response> => {
        try {
            const headers = new Headers();
            headers.append('Cache-Control', 'no-cache');
            // add special header to recognize ping requests
            headers.append('X-Ping', '1');
            const request = new Request(
                requestUrlWithRandomParams,
                {
                    redirect: 'manual',
                    cache: 'no-cache',
                    headers,
                },
            );

            const response = await fetch(request, { signal: controller.signal });
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // if request is blocked with adblocker, it returns 500 error for the first request,
            // so we additionally check if response status is ok
            if (!response.ok) {
                throw new Error('Server response is not ok');
            }
            return response;
        } catch (e) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            throw e;
        }
    };

    // Promise race fulfils when first of the promises fulfils
    return Promise.race([
        fetchHandler(),
        new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                controller.abort();
                reject(new Error(`Request to ${requestUrlWithRandomParams} stopped by timeout`));
            }, fetchTimeout);
        }),
    ]);
};

/**
 * Determines ping to the endpoint.
 *
 * @param domainName
 *
 * @returns Promise with ping in ms or null if it's not available.
 */
export const measurePingToEndpointViaFetch = async (domainName: string): Promise<number | null> => {
    const FETCH_TIMEOUT_MS = 3000;
    const requestUrl = `https://${domainName}/`;

    let ping = null;
    const POLLS_NUMBER = 3;

    for (let i = 0; i < POLLS_NUMBER; i += 1) {
        const start = Date.now();
        try {
            // eslint-disable-next-line no-await-in-loop
            await fetchWithTimeout(requestUrl, FETCH_TIMEOUT_MS);
            const fetchPing = Date.now() - start;
            // don't handle negative values for fetchPing
            // https://github.com/AdguardTeam/AdGuardVPNExtension/issues/106
            if (fetchPing >= 0 && (!ping || fetchPing < ping)) {
                ping = fetchPing;
            }
        } catch (e) {
            log.error(`Was unable to get ping to ${requestUrl} due to ${e.message}`);
        }
    }

    return ping;
};

/**
 * Max simultaneous connections for determining ping
 */
const MAX_SIMULTANEOUS_CONNECTIONS = 10;

/**
 * Pool of available connections
 */
const connectionsPool: string[] = [];

/**
 * Determines ping to the endpoint using maximum of simultaneous connections
 * It checks if there is space in the pool and if there is, it creates new connection.
 *
 * @returns Promise with ping in ms or null if it's not available.
 */
export const measurePingWithinLimits = async (
    domainName: string,
    maxConnections = MAX_SIMULTANEOUS_CONNECTIONS,
): Promise<number | null> => {
    if (connectionsPool.length >= maxConnections) {
        await sleep(10);
        return measurePingWithinLimits(domainName, maxConnections);
    }

    connectionsPool.push(domainName);
    const ping = await measurePingToEndpointViaFetch(domainName);
    connectionsPool.shift();

    return ping;
};
