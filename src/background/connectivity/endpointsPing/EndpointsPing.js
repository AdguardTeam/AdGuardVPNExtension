import { renderTemplate } from '../../../lib/string-utils';
import { WS_API_URL_TEMPLATE } from '../../config';
import { determinePing } from '../pingHelpers';
import log from '../../../lib/logger';

/**
 * Measures ping to endpoint with provided domain name and credentials
 */
class EndpointsPing {
    constructor({ credentials, websocketFactory }) {
        this.credentials = credentials;
        this.websocketFactory = websocketFactory;
    }

    measurePingToEndpoint = async (domainName) => {
        const { prefix, token } = await this.credentials.getAccessCredentials();
        const appId = this.credentials.getAppId();
        const wsHost = `${prefix}.${domainName}`;
        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host: wsHost });

        let ping;
        try {
            const websocket = await this.websocketFactory.createNativeWebsocket(websocketUrl);
            await websocket.open();
            ping = await determinePing(websocket, token, appId, true);
            websocket.close();
        } catch (e) {
            log.error('Was unable to get ping', websocketUrl);
            if (e.message) {
                log.error('due to error', e.message);
            }
        }

        return ping;
    };

    measurePingToEndpointViaFetch = async (domainName) => {
        const { prefix } = await this.credentials.getAccessCredentials();
        const wsHost = `${prefix}.${domainName}`;

        let ping;
        const POLLS_COUNT = 3;
        for (let i = 0; i < POLLS_COUNT; i += 1) {
            const start = Date.now();
            try {
                // TODO set existing url
                // eslint-disable-next-line no-await-in-loop
                await fetch(new Request(`https://${wsHost}/ping`, { redirect: 'manual' }));
                const fetchPing = Date.now() - start;
                if (!ping || fetchPing < ping) {
                    ping = fetchPing;
                }
            } catch (e) {
                log.error(`Was unable to get ping to ${wsHost} due to ${e}`);
            }
        }
        return ping;
    }
}

export default EndpointsPing;
