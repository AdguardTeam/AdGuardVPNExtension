import { MockServer } from 'jest-mock-server';
import { Api } from '../../../src/background/api/Api';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';

describe('Api tests', () => {
    const server = new MockServer();

    beforeAll(() => server.start());
    afterAll(() => server.stop());
    beforeEach(() => server.reset());

    it('Test make request', async () => {
        const BAD_REQUEST_400 = '/bad_request_400';
        const GOOD_REQUEST_200 = '/good_request_200';
        server
            .get(GOOD_REQUEST_200)
            .mockImplementationOnce((ctx) => {
                ctx.status = 200;
                ctx.body = 'response OK';
            });

        server
            .get(BAD_REQUEST_400)
            .mockImplementationOnce((ctx) => {
                ctx.status = 400;
            });

        // Since we did not passed any port into server constructor, server was started at random free port
        const serverOrigin = server.getURL().origin;
        // path argument is stubbes as getRequestUrl going to be mocked each time
        const api = new Api('');

        const getRequestUrlMock = jest.spyOn(api, 'getRequestUrl');
        getRequestUrlMock.mockResolvedValue(serverOrigin);
        expect(await api.getRequestUrl('')).toBe(serverOrigin);

        getRequestUrlMock.mockResolvedValue(new URL(GOOD_REQUEST_200, serverOrigin).href);
        const data = await api.makeRequest(GOOD_REQUEST_200, {}, 'GET');
        expect(data).toBe('response OK');

        // expect(await api.makeRequest(BAD_REQUEST_400, {}, 'GET')).rejects.toThrow();
    });
});
