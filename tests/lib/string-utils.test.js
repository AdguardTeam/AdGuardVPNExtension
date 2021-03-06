import { renderTemplate, isHttp, isValidExclusion } from '../../src/lib/string-utils';

describe('index.proxy.setBypassList', () => {
    it('should NOT be called before initialization', () => {
        expect(renderTemplate('https://{{host}}/path', { host: 'example.org' }))
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

describe('isHttp', () => {
    it('determines valid urls', () => {
        expect(isHttp('http://example.org/test')).toBeTruthy();
        expect(isHttp('https://example.org/test')).toBeTruthy();
        expect(isHttp('chrome://some_id/test')).toBeFalsy();
        expect(isHttp('about:blank')).toBeFalsy();
    });
});

describe('isValidExclusion', () => {
    it('finds valid exclusions', () => {
        expect(isValidExclusion('example.org')).toBeTruthy();
        expect(isValidExclusion('*.example.org')).toBeTruthy();
        expect(isValidExclusion('api.*.org')).toBeTruthy();
    });
    it('finds invalid exclusions', () => {
        expect(isValidExclusion('*org')).toBeFalsy();
        expect(isValidExclusion('exa#mple.org')).toBeFalsy();
        expect(isValidExclusion('*example.org')).toBeFalsy();
        expect(isValidExclusion('**.example.org')).toBeFalsy();
    });
});
