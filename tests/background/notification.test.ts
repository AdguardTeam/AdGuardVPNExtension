import {
    vi,
    describe,
    it,
    expect,
    type Mock,
} from 'vitest';
import browser from 'webextension-polyfill';

import { notifications } from '../../src/background/notifications';

vi.mock('webextension-polyfill', () => ({
    default: {
        notifications: {
            create: vi.fn(async () => {}),
        },
        runtime: {
            getURL: vi.fn(() => ''),
        },
    },
}));

vi.mock('../../src/common/translator', () => {
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
        expect((browser.notifications.create as Mock)
            .mock.calls[0][1].message).toEqual(expectedMsg);
    });
});
