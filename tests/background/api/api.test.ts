import {
    vi,
    describe,
    beforeAll,
    afterAll,
    it,
    expect,
} from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { Api } from '../../../src/background/api/Api';

const fetchMocker = createFetchMock(vi);

const REQUEST_PATH = '/test-request';
const ERROR_REQUEST_PATH = '/error-request';

const testData = {
    testValue1: 'test1',
    testValue2: 'test2',
};

const api = new Api('');
const getRequestUrlMock = vi.spyOn(api, 'getRequestUrl');
const serverOrigin = 'http://localhost:3000';

describe('makeRequest tests', () => {
    beforeAll(() => {
        fetchMocker.enableMocks();
    });

    afterAll(() => {
        fetchMocker.disableMocks();
    });

    it('Successful request', async () => {
        fetchMocker.mockResponseOnce({
            body: JSON.stringify(testData),
            status: 200,
        });

        getRequestUrlMock.mockResolvedValue(serverOrigin);
        expect(await api.getRequestUrl('')).toBe(serverOrigin);

        getRequestUrlMock.mockResolvedValue(new URL(REQUEST_PATH, serverOrigin).href);
        const data = await api.makeRequest(REQUEST_PATH, {}, 'GET') as any;
        expect(data.testValue1).toBe(testData.testValue1);
        expect(data.testValue2).toBe(testData.testValue2);
    });

    it('Successful request with empty body', async () => {
        fetchMocker.mockResponseOnce({
            status: 200,
        });

        getRequestUrlMock.mockResolvedValue(serverOrigin);
        expect(await api.getRequestUrl('')).toBe(serverOrigin);

        getRequestUrlMock.mockResolvedValue(new URL(REQUEST_PATH, serverOrigin).href);
        const data = await api.makeRequest(REQUEST_PATH, {}, 'GET');
        expect(data).toBe(undefined);
    });

    it('Error request', async () => {
        fetchMocker.mockResponseOnce({
            body: JSON.stringify(testData),
            status: 400,
        });

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
        fetchMocker.mockResponseOnce({
            status: 401,
        });

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
