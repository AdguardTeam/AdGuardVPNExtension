import WebSocket from 'ws';
import ReconnectingWebsocket from '../../../../src/background/connectivity/websocket/ReconnectingWebsocket';
import { sleep } from '../../../../src/lib/helpers';

beforeEach(() => {
    global.WebSocket = WebSocket;
});

afterEach(() => {
    delete global.WebSocket;
    jest.restoreAllMocks();
});

const PORT = 50123;
const URL = `ws://localhost:${PORT}`;

describe('ReconnectingWebsocket', () => {
    test('starts closed', async () => {
        const ws = new ReconnectingWebsocket(URL);
        expect(ws.readyState).toEqual(ReconnectingWebsocket.CLOSED);
        await ws.close();
    });

    test('successfully connects to the websocket server', async (done) => {
        const ws = new ReconnectingWebsocket(URL);

        const wss = new WebSocket.Server({ port: PORT });
        wss.on('connection', (ws) => {
            ws.on('message', (msg) => {
                ws.send(msg);
            });
        });
        wss.on('error', (e) => {
            throw Error(e.message);
        });

        const anyMessage = 'any message';
        expect.assertions(3);

        ws.addEventListener('open', () => {
            expect(ws.readyState).toBe(ws.OPEN);
        });

        await ws.open();

        ws.send(anyMessage);
        ws.addEventListener('message', (msg) => {
            expect(msg.data).toEqual(anyMessage);
        });

        await sleep(100);
        await ws.close();
        expect(ws.readyState).toBe(ws.CLOSED);
        wss.close(() => {
            done();
        });
    });

    test('throws error if can not connect', async () => {
        const ws = new ReconnectingWebsocket(URL);
        expect.assertions(1);
        try {
            await ws.connect();
        } catch (e) {
            expect(e).toBeDefined();
        }
        await ws.close();
    });

    test('tries to reconnect', async (done) => {
        const ws = new ReconnectingWebsocket(URL);
        try {
            await ws.open();
        } catch (e) {
            expect(e).toBeDefined();
        }

        expect(ws.readyState).toBe(ReconnectingWebsocket.CONNECTING);

        // Should eventually fire after ws server start
        ws.addEventListener('open', () => {
            expect(ws.readyState).toBe(ws.OPEN);
        });

        // start ws server
        const wss = new WebSocket.Server({ port: PORT });
        wss.on('connection', (ws) => {
            ws.on('message', (msg) => {
                ws.send(msg);
            });
        });
        wss.on('error', (e) => {
            throw Error(e.message);
        });

        await sleep(300);
        await ws.close();
        wss.close(() => {
            done();
        });
    });

    test('after retry attempts is closed', async (done) => {
        const ws = new ReconnectingWebsocket(URL, { maxRetries: 1 });

        // start ws server
        const wss = new WebSocket.Server({ port: PORT });
        wss.on('connection', (ws) => {
            ws.on('message', (msg) => {
                ws.send(msg);
            });
        });
        wss.on('error', (e) => {
            throw Error(e.message);
        });

        await ws.open();

        expect.assertions(3);
        expect(ws.readyState).toEqual(ReconnectingWebsocket.OPEN);

        // close ws server
        wss.close();

        // after all attempts fires close event
        ws.addEventListener('close', () => {
            expect(ws.readyState).toEqual(ReconnectingWebsocket.CLOSED);
        });

        // wait until all attempts are over
        await sleep(2000);

        // finally readyState is CLOSED
        expect(ws.readyState).toEqual(ReconnectingWebsocket.CLOSED);

        await ws.close();
        done();
    });
});
