import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';

const mockCreateWebsocket = vi.hoisted(() => vi.fn());

vi.hoisted(() => {
    // The WS url template is required by EndpointConnectivity.start().
    (globalThis as any).__APP_CONFIG__ = { WS_API_URL_TEMPLATE: 'wss://{{host}}/{{hash}}' };
});

vi.mock('../../../src/background/connectivity/websocket', () => ({
    websocketFactory: {
        createWebsocket: mockCreateWebsocket,
    },
}));

// eslint-disable-next-line import/first
import { notifier } from '../../../src/common/notifier';
// eslint-disable-next-line import/first
import { endpointConnectivity } from '../../../src/background/connectivity/endpointConnectivity';

const CONNECTING = 0;
const OPEN = 1;

/**
 * Minimal WebSocket mock: send() throws while the socket is not open,
 * same as the real WebSocket does.
 *
 * @returns WebSocket mock.
 */
const createWebsocketMock = (): Record<string, unknown> => {
    const ws: Record<string, unknown> = {
        readyState: CONNECTING,
        OPEN,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        send: vi.fn(() => {
            if (ws.readyState !== OPEN) {
                throw new Error('WebSocket is not open');
            }
        }),
    };

    return ws;
};

describe('EndpointConnectivity DNS notifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should skip sending the DNS while the socket is connecting', () => {
        const ws = createWebsocketMock();
        mockCreateWebsocket.mockReturnValue(ws);

        endpointConnectivity.start();

        // The DNS changes while the socket is still connecting: send() would
        // throw and fail the profile switch. The DNS is re-sent on socket open.
        expect(() => {
            notifier.notifyListeners(notifier.types.DNS_SERVER_SET, '1.2.3.4');
        }).not.toThrow();
        expect(ws.send).not.toHaveBeenCalled();

        ws.readyState = OPEN;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, '1.2.3.4');

        expect(ws.send).toHaveBeenCalledTimes(1);
    });
});
