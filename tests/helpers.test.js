/* global QUnit */

import sinon from 'sinon';
import {
    lazyGet,
    getHostname,
    getClosestEndpointByCoordinates,
} from '../src/lib/helpers';

const { test } = QUnit;

test('lazyGet', (assert) => {
    assert.deepEqual(
        lazyGet({ _x: { test: 1 } }, 'x', null),
        { test: 1 },
        'should return the existing value form the cache'
    );
    const cb = function () { return this._x + 1; };
    assert.deepEqual(
        lazyGet({ _x: 1 }, 'y', cb),
        2,
        'should calculate and return the new value'
    );
    const obj = { _x: 1 };
    lazyGet(obj, 'y', cb);
    assert.deepEqual(
        obj._y,
        2,
        'should memoize new value in the cache'
    );
});

test('lazyGet callback', (assert) => {
    const stub = sinon.stub();
    const cb = stub.callsFake(function () { return this._x + 1; });
    lazyGet({ _x: 1 }, 'x', cb);
    assert.strictEqual(cb.called, false, 'should NOT be called if the property is already memoized');
    cb.resetHistory();
    lazyGet({ _x: 1 }, 'y', cb);
    assert.strictEqual(cb.called, true, 'should be called if the property is NOT already memoized');
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
        { coordinates: [39, 32] },
        { coordinates: [25, 57] },
        { coordinates: [37, 23] },
        { coordinates: [36, 174] },
        { coordinates: [13, 100] },
        { coordinates: [41, 2] },
        { coordinates: [39, 116] },
        { coordinates: [1, 48] },
        { coordinates: [54, 5] },
        { coordinates: [44, 20] },
        { coordinates: [52, 13] },
        { coordinates: [52, 1] },
        { coordinates: [4, 74] },
        { coordinates: [19, 72] },
        { coordinates: [44, 0] },
        { coordinates: [53, 8] },
        { coordinates: [27, 153] },
        { coordinates: [51, 2] },
        { coordinates: [50, 4] },
        { coordinates: [44, 26] },
        { coordinates: [47, 19] },
        { coordinates: [34, 58] },
        { coordinates: [30, 31] },
        { coordinates: [22, 88] },
        { coordinates: [23, 113] },
        { coordinates: [33, 18] },
        { coordinates: [10, 67] },
        { coordinates: [4, 52] },
        { coordinates: [28, 106] },
        { coordinates: [29, 106] },
        { coordinates: [55, 12] },
        { coordinates: [31, 64] },
        { coordinates: [14, 17] },
        { coordinates: [12, 130] },
        { coordinates: [11, 43] },
        { coordinates: [53, 6] },
        { coordinates: [29, 30] },
        { coordinates: [55, 3] },
        { coordinates: [50, 8] },
        { coordinates: [6, 58] },
        { coordinates: [55, 4] },
        { coordinates: [14, 90] },
        { coordinates: [2, 79] },
        { coordinates: [53, 10] },
        { coordinates: [70, 23] },
        { coordinates: [23, 82] },
        { coordinates: [60, 25] },
        { coordinates: [42, 147] },
        { coordinates: [22, 114] },
        { coordinates: [20, 70] },
        { coordinates: [52, 104] },
        { coordinates: [6, 106] },
        { coordinates: [26, 28] },
        { coordinates: [17, 76] },
        { coordinates: [4, 15] },
        { coordinates: [3, 101] },
        { coordinates: [16, 68] },
        { coordinates: [53, 1] },
        { coordinates: [12, 77] },
        { coordinates: [38, 9] },
        { coordinates: [53, 3] },
        { coordinates: [51, 0] },
        { coordinates: [45, 4] },
        { coordinates: [40, 3] },
        { coordinates: [53, 2] },
        { coordinates: [14, 120] },
        { coordinates: [43, 5] },
        { coordinates: [23, 106] },
        { coordinates: [21, 39] },
        { coordinates: [37, 144] },
        { coordinates: [19, 99] },
        { coordinates: [45, 9] },
        { coordinates: [34, 56] },
        { coordinates: [48, 11] },
        { coordinates: [32, 129] },
        { coordinates: [35, 136] },
        { coordinates: [1, 36] },
        { coordinates: [32, 118] },
        { coordinates: [40, 14] },
        { coordinates: [28, 77] },
        { coordinates: [54, 1] },
        { coordinates: [46, 30] },
        { coordinates: [34, 135] },
        { coordinates: [59, 10] },
        { coordinates: [8, 79] },
        { coordinates: [5, 55] },
        { coordinates: [48, 2] },
        { coordinates: [31, 115] },
        { coordinates: [50, 4] },
        { coordinates: [9, 147] },
        { coordinates: [50, 14] },
        { coordinates: [16, 96] },
        { coordinates: [64, 21] },
        { coordinates: [22, 43] },
        { coordinates: [41, 12] },
        { coordinates: [12, 38] },
        { coordinates: [33, 70] },
        { coordinates: [59, 30] },
        { coordinates: [23, 46] },
        { coordinates: [31, 121] },
        { coordinates: [1, 103] },
        { coordinates: [42, 23] },
        { coordinates: [59, 18] },
        { coordinates: [34, 151] },
        { coordinates: [18, 47] },
        { coordinates: [35, 51] },
        { coordinates: [35, 139] },
        { coordinates: [32, 13] },
        { coordinates: [45, 12] },
        { coordinates: [19, 96] },
        { coordinates: [48, 16] },
        { coordinates: [43, 132] },
        { coordinates: [52, 21] },
        { coordinates: [41, 174] },
        { coordinates: [47, 8] },
    ];
    assert.deepEqual(
        getClosestEndpointByCoordinates({ coordinates: [55, 37] }, COORDS),
        { coordinates: [59, 30] },
        'should find the closest server correctly'
    );
});
