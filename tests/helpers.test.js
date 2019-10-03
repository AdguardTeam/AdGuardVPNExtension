/* global QUnit */

import sinon from 'sinon';
import {
    lazyGet,
    getHostname,
    getClosestEndpointByCoordinates,
} from '../src/lib/helpers';

const { test } = QUnit;

test('lazyGet', (assert) => {
    assert.deepEqual(lazyGet({ _x: 1 }, 'x', null), 1, 'should return existing value from the cache');
});

test('lazyGet callback', (assert) => {
    const stub = sinon.stub();
    const cb = stub.callsFake(() => (
        { one: 1 }));
    const obj = {
        get property() {
            return lazyGet(obj, 'one', cb);
        },
    };
    // eslint-disable-next-line no-unused-expressions
    obj.property;
    assert.strictEqual(cb.calledOnce, true, 'should be called if invoked for the first time');
    // eslint-disable-next-line no-unused-expressions
    obj.property;
    assert.strictEqual(cb.calledTwice, false, 'should NOT be called if invoked for the second time');
    // eslint-disable-next-line no-unused-expressions
    obj.property;
    assert.strictEqual(cb.calledOnce, true, 'should NOT be called if invoked for subsequent times');
});

test('getHostname', (assert) => {
    assert.strictEqual(
        getHostname('https://adguard.com/ru/welcome.html'),
        'adguard.com',
        'should return hostname if invoked with URL HTTPS'
    );
    assert.strictEqual(
        getHostname('http://example.com'),
        'example.com',
        'should return hostname if invoked with URL HTTP'
    );
    assert.strictEqual(
        getHostname('/en-US/docs'),
        '/en-US/docs',
        'should return the argument if it is incorrect URL'
    );
});
test('getClosestEndpointByCoordinates', (assert) => {
    const COORDS = [
        { coordinates: [57, 2] },
        { coordinates: [34, 138] },
        { coordinates: [36, 3] },
        { coordinates: [52, 4] },
        { coordinates: [59, 30] },
    ];
    assert.deepEqual(
        getClosestEndpointByCoordinates({ coordinates: [55, 37] }, COORDS),
        { coordinates: [59, 30] },
        'should find the closest server correctly'
    );
});
