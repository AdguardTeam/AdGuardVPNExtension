import browser from 'webextension-polyfill';
import { notifications } from '../../src/background/notifications';

jest.mock('webextension-polyfill', () => {
    return {
        notifications: {
            create: jest.fn(async () => {}),
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

describe('notification', () => {
    it('creates notification', async () => {
        const expectedMsg = 'test message';
        await notifications.create({ message: expectedMsg });
        expect(browser.notifications.create).toHaveBeenCalledTimes(1);
        expect((browser.notifications.create as jest.Mock)
            .mock.calls[0][1].message).toEqual(expectedMsg);
    });
});
