import { MockServer } from 'jest-mock-server';
import { Api } from '../../../src/background/api/Api';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';

describe('Api tests', () => {
    const server = new MockServer();

    beforeAll(() => server.start());
    afterAll(() => server.stop());
    beforeEach(() => server.reset());

    it('Test make request', async () => {
        server
            .get('/')
            // Look ma, plain Jest API!
            .mockImplementationOnce((ctx) => {
                ctx.status = 200;
            });

        const api = new Api(server.getURL().toString());

        const getRequestUrlMock = jest.spyOn(api as Api, 'getRequestUrl');
        getRequestUrlMock.mockResolvedValue(server.getURL().toString());

        // Since we did not passed any port into server constructor, server was started at random free port
        const url = server.getURL();

        const res1 = await api.makeRequest('', {}, 'GET');
        expect(res1.status).toBe(200);
        expect(await api.getRequestUrl('')).toBe('/');
    });
});
