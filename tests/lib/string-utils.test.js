import { renderTemplate, isHttp, customShExpMatch } from '../../src/lib/string-utils';

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

describe('customShExpMatch', () => {
    it('works with default list', () => {
        expect(customShExpMatch('http://example.org/?url=https://adguard.com/test/license.html', 'adguard.com/*/license.html')).toBeFalsy();
        expect(customShExpMatch('https://adguard.com/test/license.html', 'adguard.com/*/license.html')).toBeTruthy();
        expect(customShExpMatch('http://adguard.com/test/license.html', 'adguard.com/*/license.html')).toBeTruthy();
        expect(customShExpMatch('https://adguard.com/test/licenses.html', 'adguard.com/*/license.html')).toBeFalsy();

        expect(customShExpMatch('https://adguard.com/pg/page_example', 'adguard.com/pg/*')).toBeTruthy();
        expect(customShExpMatch('http://auth.adguard.io/custom_url', '*.adguard.io/*')).toBeTruthy();
        expect(customShExpMatch('http://adguard.io/custom_url', '*.adguard.io/*')).toBeFalsy();

        expect(customShExpMatch('https://account.adguard.com/custom/url', 'account.adguard.com/*')).toBeTruthy();
        expect(customShExpMatch('http://account.adguard.com/custom/url', 'account.adguard.com/*')).toBeTruthy();

        expect(customShExpMatch('https://adguard.com/en/license.html?email=mtopciu@adguard.com', 'adguard.com/*/license.html*')).toBeTruthy();
    });
});
