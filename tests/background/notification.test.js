import browser from 'webextension-polyfill';
import { notifications } from '../../src/background/notifications';

jest.mock('webextension-polyfill', () => {
    return {
        ...global.chrome,
        notifications: {
            create: jest.fn(async () => {}),
        },
    };
});

describe('notification', () => {
    it('creates notification', async () => {
        const expectedMsg = 'test message';
        await notifications.create({ message: expectedMsg });
        expect(browser.notifications.create).toHaveBeenCalledTimes(1);
        expect(browser.notifications.create.mock.calls[0][1].message).toEqual(expectedMsg);
    });
});
