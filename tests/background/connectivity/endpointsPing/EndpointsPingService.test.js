import EndpointsPing from '../../../../src/background/connectivity/endpointsPing/EndpointsPing';

const buildCredentials = (prefix, token, appId) => {
    return {
        getAccessCredentials: jest.fn(async () => {
            return {
                prefix,
                token,
            };
        }),
        getAppId: jest.fn(() => {
            return appId;
        }),
    };
};

const buildWsFactory = (Websocket, ping) => {
    let ws;
    return {
        createNativeWebsocket: jest.fn((websocketUrl) => {
            ws = new Websocket(websocketUrl, ping);
            return ws;
        }),
        ws: () => {
            return ws;
        },
    };
};

class Websocket {
    constructor(url, timeout) {
        this.url = url;
        this.timeout = timeout;
    }

    scheduleResponse = (message) => {
        setTimeout(() => {
            this.callback({ data: message });
        }, this.timeout);
    };

    open = jest.fn();

    send = jest.fn((message) => {
        this.scheduleResponse(message);
    });

    addEventListener = jest.fn((event, handler) => {
        if (event === 'message') {
            this.callback = handler;
        }
    });

    removeEventListener = jest.fn((event) => {
        if (event === 'message') {
            delete this.callback;
        }
    });

    close = jest.fn();
}

describe('EndpointsPingService', () => {
    it('communicates with websocket and calculates average ping', async () => {
        const expectedPrefix = 'prefix';
        const expectedDomainName = 'do-gb-lon1-01-hk7z7xez.adguard.io';
        const expectedWsUrl = `wss://${expectedPrefix}.${expectedDomainName}:8443/user_metrics`;

        const credentials = buildCredentials(expectedPrefix, 'expected-token', 'expected-appId');
        const expectedAveragePing = 30;

        const websocketFactory = buildWsFactory(Websocket, expectedAveragePing);

        const endpointsPing = new EndpointsPing({ credentials, websocketFactory });
        const endpoint = { domainName: 'do-gb-lon1-01-hk7z7xez.adguard.io' };
        const ping = await endpointsPing.measurePingToEndpoint(endpoint.domainName);

        expect(ping).toBeDefined();

        const ws = websocketFactory.ws();
        expect(ws.url).toEqual(expectedWsUrl);
        expect(ws.open).toBeCalledTimes(1);
        expect(ws.close).toBeCalledTimes(1);
        expect(ws.send).toBeCalledTimes(3);
        expect(ws.addEventListener).toBeCalledTimes(3);
        expect(ws.removeEventListener).toBeCalledTimes(3);
    });
});
