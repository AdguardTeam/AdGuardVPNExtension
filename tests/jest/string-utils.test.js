import { renderTemplate } from '../../src/lib/string-utils';

const {
    describe, it, expect,
} = global;

describe('whitelist.proxy.setBypassWhitelist', () => {
    it('should NOT be called before initialization', () => {
        expect(renderTemplate('https://{{host}}/path', { host: 'example.org' }),)
            .toEqual('https://example.org/path');
    });
    it('should render templates with multiple tags', () => {
        expect(renderTemplate('https://{{host}}/path/{{param1}}/{{param2}}', {
            host: 'example.org',
            param1: 'a',
            param2: '1',
        }))
            .toEqual('https://example.org/path/a/1');
    });
});
