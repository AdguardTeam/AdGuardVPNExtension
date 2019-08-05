/* global QUnit */

import { Notifier } from '../src/lib/notifier';

const testNotifier = new Notifier({
    SETTING_UPDATED: 'settings.updated',
    PROXY_ENABLED: 'proxy.enabled',
});

const { test, module } = QUnit;

module('notifier');

test('notifies all listeners', (assert) => {
    const changing = {};
    const firstListener = (setting, value) => {
        changing.first = { id: 'first', setting, value };
    };

    const secondListener = (setting, value) => {
        changing.second = { id: 'second', setting, value };
    };

    testNotifier.addListener(firstListener);
    testNotifier.addListener(secondListener);

    const settingId = 'globalEnabled';
    const settingValue = true;

    testNotifier.notifyListeners(testNotifier.types.SETTING_UPDATED, settingId, settingValue);

    assert.strictEqual(changing.first.id, 'first', 'values should be equal');
    assert.strictEqual(changing.first.setting, settingId, 'values should be equal');
    assert.strictEqual(changing.first.value, settingValue, 'values should be equal');
    assert.strictEqual(changing.second.id, 'second', 'values should be equal');
    assert.strictEqual(changing.second.setting, settingId, 'values should be equal');
    assert.strictEqual(changing.second.value, settingValue, 'values should be equal');
});

test('notifies specified listeners', (assert) => {
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
            id: 'first', setting, value, counter: firstCounter,
        };
    };

    let secondCounter = 0;
    const secondListener = (proxyStatus) => {
        secondCounter += 1;
        changing.second = { id: 'second', proxyStatus, counter: secondCounter };
    };

    testNotifier.addSpecifiedListener(testNotifier.types.SETTING_UPDATED, firstListener);
    testNotifier.addSpecifiedListener(testNotifier.types.PROXY_ENABLED, secondListener);

    const settingId = 'globalEnabled';
    const settingValue = true;
    const proxyStatus = true;

    testNotifier.notifyListeners(testNotifier.types.SETTING_UPDATED, settingId, settingValue);

    assert.strictEqual(changing.first.id, 'first', 'values should be equal');
    assert.strictEqual(changing.first.setting, settingId, 'values should be equal');
    assert.strictEqual(changing.first.value, settingValue, 'values should be equal');
    assert.strictEqual(changing.first.counter, 1, 'function should be called once');
    assert.strictEqual(changing.second.counter, 0, 'second listener should not be called');

    testNotifier.notifyListeners(testNotifier.types.PROXY_ENABLED, proxyStatus);
    assert.strictEqual(changing.second.proxyStatus, true, 'proxy status should remain unchanged');
    assert.strictEqual(changing.second.counter, 1, 'second listener should be called once');
    assert.strictEqual(changing.first.counter, 1, 'function should be called once');
});
