import browser from 'webextension-polyfill';

import { notifications } from '../../src/background/notifications';

jest.mock('webextension-polyfill', () => {
    return {
        notifications: {
            create: jest.fn(async () => {}),
        },
        runtime: {
            getURL: jest.fn(() => ''),
        },
    };
});

jest.mock('../../src/common/translator', () => {
    return {
        translator: {
            getMessage: () => 'AdGuard VPN',
        },
    };
});

jest.mock('../../src/background/browserApi/storage');
jest.mock('../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

describe('notification', () => {
    it('creates notification', async () => {
        const expectedMsg = 'test message';
        await notifications.create({ message: expectedMsg });
        expect(browser.notifications.create).toHaveBeenCalledTimes(1);
        expect((browser.notifications.create as jest.Mock)
            .mock.calls[0][1].message).toEqual(expectedMsg);
    });
});
