/* global QUnit */

import sinon from 'sinon';
import {
    lazyGet,
    getHostname,
    getClosestEndpointByCoordinates,
} from '../src/lib/helpers';

const { test } = QUnit;

test('lazyGet callback', (assert) => {
    const expectedColor = 'blue';
    const cb = sinon.fake.returns(expectedColor);
    const obj = {
        get color() {
            return lazyGet(obj, 'color', cb);
        },
    };

    // first property call
    assert.strictEqual(obj.color, expectedColor, 'values should be equal');
    assert.strictEqual(cb.calledOnce, true, 'should be called if invoked for the first time');

    // second property call
    assert.strictEqual(obj.color, expectedColor, 'values should be equal');
    assert.strictEqual(cb.calledTwice, false, 'should NOT be called if invoked for the second time');
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
