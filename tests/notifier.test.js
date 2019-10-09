import { Notifier } from '../src/lib/notifier';

describe('notifier', () => {
    const testNotifier = new Notifier({
        SETTING_UPDATED: 'settings.updated',
        PROXY_ENABLED: 'proxy.enabled',
    });
    const changing = {};
    const firstListener = (setting, value) => {
        changing.first = {
            id: 'first',
            setting,
            value,
        };
    };

    const secondListener = (setting, value) => {
        changing.second = {
            id: 'second',
            setting,
            value,
        };
    };

    testNotifier.addListener(firstListener);
    testNotifier.addListener(secondListener);

    const settingId = 'globalEnabled';
    const settingValue = true;

    testNotifier.notifyListeners(testNotifier.types.SETTING_UPDATED, settingId, settingValue);
    it('notifies all listeners', () => {
        expect(changing.first.id)
            .toEqual('first');
    });
    it('values should be equal', () => {
        expect(changing.first.setting)
            .toEqual(settingId);
    });
    it('values should be equal', () => {
        expect(changing.first.value)
            .toEqual(settingValue);
    });
    it('values should be equal', () => {
        expect(changing.second.id)
            .toEqual('second');
    });
    it('values should be equal', () => {
        expect(changing.second.setting)
            .toEqual(settingId);
    });
    it('values should be equal', () => {
        expect(changing.second.value)
            .toEqual(settingValue);
    });
});

describe('notifies specified listeners', () => {
    const testNotifier = new Notifier({
        SETTING_UPDATED: 'settings.updated',
        PROXY_ENABLED: 'proxy.enabled',
    });
    const changing = {
        second: {
            counter: 0,
        },
        first: {
            counter: 0,
        },
    };

    let firstCounter = 0;
    const firstListener = (setting, value) => {
        firstCounter += 1;
        changing.first = {
            id: 'first',
            setting,
            value,
            counter: firstCounter,
        };
    };

    let secondCounter = 0;
    const secondListener = (proxyStatus) => {
        secondCounter += 1;
        changing.second = {
            id: 'second',
            proxyStatus,
            counter: secondCounter,
        };
    };

    const settingId = 'globalEnabled';
    const settingValue = true;
    const proxyStatus = true;

    testNotifier.addSpecifiedListener(testNotifier.types.SETTING_UPDATED, firstListener);
    testNotifier.addSpecifiedListener(testNotifier.types.PROXY_ENABLED, secondListener);
    describe('notifies first listeners', () => {
        beforeAll(() => testNotifier.notifyListeners(testNotifier.types.SETTING_UPDATED,
            settingId, settingValue));
        it('values should be equal', () => expect(changing.first.id)
            .toEqual('first'));
        it('values should be equal', () => expect(changing.first.setting)
            .toEqual(settingId));
        it('values should be equal', () => expect(changing.first.value)
            .toEqual(true));
        it('function should be called once', () => expect(changing.first.counter)
            .toEqual(1));
        it('listener should not be called', () => expect(changing.second.counter)
            .toEqual(0));
    });
    describe('notifies second listeners', () => {
        beforeAll(() => testNotifier.notifyListeners(testNotifier.types.PROXY_ENABLED,
            proxyStatus));
        it('proxy status should remain unchanged', () => expect(changing.second.proxyStatus)
            .toEqual(true));
        it('second listener should be called once', () => expect(changing.second.counter)
            .toEqual(1));
        it('function should be called once', () => expect(changing.first.counter)
            .toEqual(1));
    });
});
