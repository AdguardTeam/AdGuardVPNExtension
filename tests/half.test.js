/* global QUnit */

import half from '../src/lib/half';

const { test, module } = QUnit;

module('half module');

test('a basic test example', (assert) => {
    const actual = half(6);
    const expected = 3;
    assert.strictEqual(actual, expected, 'values should be equal');
});
