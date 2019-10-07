/* global QUnit */

import { renderTemplate } from '../src/lib/string-utils';

const { test } = QUnit;

test('renderTemplate', (assert) => {
    assert.strictEqual(
        renderTemplate('https://{{host}}/path', { host: 'example.org' }),
        'https://example.org/path',
        'should render templates'
    );
    assert.strictEqual(
        renderTemplate('https://{{host}}/path/{{param1}}/{{param2}}', {
            host: 'example.org',
            param1: 'a',
            param2: '1',
        }),
        'https://example.org/path/a/1',
        'should render templates with mutliple tags'
    );
});
