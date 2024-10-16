import { MockServer } from 'jest-mock-server';

import { Api } from '../../../src/background/api/Api';

const REQUEST_PATH = '/test-request';
const ERROR_REQUEST_PATH = '/error-request';

const testData = {
    testValue1: 'test1',
    testValue2: 'test2',
};

const api = new Api('');
const getRequestUrlMock = jest.spyOn(api, 'getRequestUrl');

describe('makeRequest tests', () => {
    const server = new MockServer();

    beforeAll(() => server.start());
    afterEach(() => server.reset());
    afterAll(() => server.stop());

    it('Successful request', async () => {
        server
            .get(REQUEST_PATH)
            .mockImplementation((ctx) => {
                ctx.status = 200;
                ctx.body = testData;
            });

        const serverOrigin = server.getURL().origin;
        getRequestUrlMock.mockResolvedValue(serverOrigin);
        expect(await api.getRequestUrl('')).toBe(serverOrigin);

        getRequestUrlMock.mockResolvedValue(new URL(REQUEST_PATH, serverOrigin).href);
        const data = await api.makeRequest(REQUEST_PATH, {}, 'GET');
        expect(data.testValue1).toBe(testData.testValue1);
        expect(data.testValue2).toBe(testData.testValue2);
    });

    it('Successful request with empty body', async () => {
        server
            .get(REQUEST_PATH)
            .mockImplementation((ctx) => {
                ctx.status = 200;
            });

        const serverOrigin = server.getURL().origin;
        getRequestUrlMock.mockResolvedValue(serverOrigin);
        expect(await api.getRequestUrl('')).toBe(serverOrigin);

        getRequestUrlMock.mockResolvedValue(new URL(REQUEST_PATH, serverOrigin).href);
        const data = await api.makeRequest(REQUEST_PATH, {}, 'GET');
        expect(data).toBe(undefined);
    });

    it('Error request', async () => {
        server
            .get(ERROR_REQUEST_PATH)
            .mockImplementation((ctx) => {
                ctx.status = 400;
                ctx.body = JSON.stringify(testData);
            });

        const serverOrigin = server.getURL().origin;
        getRequestUrlMock.mockResolvedValue(new URL(ERROR_REQUEST_PATH, serverOrigin).href);

        try {
            await api.makeRequest(ERROR_REQUEST_PATH, {}, 'GET');
        } catch (e) {
            expect(e).toBeDefined();
            expect(e.status).toBe(400);

            const responseErrorData = JSON.parse(e.message);
            expect(responseErrorData.testValue1).toBe('test1');
            expect(responseErrorData.testValue2).toBe('test2');
        }
    });

    it('Error request with empty body', async () => {
        server
            .get(ERROR_REQUEST_PATH)
            .mockImplementation((ctx) => {
                ctx.status = 401;
            });

        const serverOrigin = server.getURL().origin;
        getRequestUrlMock.mockResolvedValue(new URL(ERROR_REQUEST_PATH, serverOrigin).href);

        try {
            await api.makeRequest(ERROR_REQUEST_PATH, {}, 'GET');
        } catch (e) {
            expect(e).toBeDefined();
            expect(e.status).toBe(401);
            expect(e.message).toEqual(expect.any(String));
        }
    });
});
