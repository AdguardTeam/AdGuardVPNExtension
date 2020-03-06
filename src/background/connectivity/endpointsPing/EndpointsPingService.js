import { renderTemplate } from '../../../lib/string-utils';
import { WS_API_URL_TEMPLATE } from '../../config';
import { calculateAveragePing } from '../helpers';
import log from '../../../lib/logger';

/**
 * Measures ping to endpoint with provided domain name and credentials
 */
class EndpointsPingService {
    constructor(credentials, websocketFactory) {
        this.credentials = credentials;
        this.websocketFactory = websocketFactory;
    }

    measurePingToEndpoint = async (domainName) => {
        const { prefix, token } = await this.credentials.getAccessCredentials();
        const appId = this.credentials.getAppId();
        const wsHost = `${prefix}.${domainName}`;
        const websocketUrl = renderTemplate(WS_API_URL_TEMPLATE, { host: wsHost });

        let averagePing;
        try {
            const websocket = await this.websocketFactory.createNativeWebsocket(websocketUrl);
            await websocket.open();
            averagePing = await calculateAveragePing(websocket, token, appId, true);
            websocket.close();
        } catch (e) {
            log.error('Was unable to get ping', websocketUrl);
        }

        return averagePing;
    };
}

export default EndpointsPingService;
