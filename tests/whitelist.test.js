/* global QUnit */

import sinon from 'sinon';
import { Whitelist } from '../src/background/whitelist';

const { test } = QUnit;

const proxy = {
    setBypassWhitelist: sinon.fake(),
};
const whitelist = new Whitelist(proxy);
test('whitelist', async (assert) => {
    assert.strictEqual(
        whitelist.whitelisted.length,
        0,
        'should be empty before initialization'
    );
    assert.strictEqual(
        await whitelist.isWhitelisted('http://example.com'),
        false,
        'should return false if hostname is NOT whitelisted'
    );

    await whitelist.addToWhitelist('http://example.com');

    assert.strictEqual(
        await whitelist.isWhitelisted('http://example.com'),
        true,
        'should return true if hostname is whitelisted'
    );

    assert.strictEqual(
        whitelist.whitelisted.length,
        1,
        'should add element correctly'
    );

    await whitelist.removeFromWhitelist('http://example.com');

    assert.strictEqual(
        await whitelist.isWhitelisted('http://example.com'),
        false,
        'should return false if hostname is removed from whitelisted'
    );

    assert.strictEqual(
        whitelist.whitelisted.length,
        0,
        'should remove element correctly'
    );
});

test('whitelist proxy setBypassWhitelist', async (assert) => {
    proxy.setBypassWhitelist.resetHistory();
    assert.strictEqual(proxy.setBypassWhitelist.notCalled, true, 'should NOT be called initially');
    await whitelist.addToWhitelist('http://example.com');
    assert.strictEqual(whitelist.proxy.setBypassWhitelist.calledOnce, true, 'should be called when added to whitelist');
    await whitelist.removeFromWhitelist('http://example.com');
    assert.strictEqual(whitelist.proxy.setBypassWhitelist.calledTwice, true, 'should be called when deleted from whitelist');
});
