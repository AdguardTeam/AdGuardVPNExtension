import ip from '../src/background/ip';

describe('is hostname routable', () => {
    it('determines correctly localhost', () => {
        expect(ip.isUrlRoutable('http://localhost')).toBeFalsy();
        expect(ip.isUrlRoutable('http://localhost:8080')).toBeFalsy();
    });

    it('determines correctly ipv4', () => {
        expect(ip.isUrlRoutable('http://127.0.0.1/')).toBeFalsy();
    });

    it('works correctly with non ip hostname', () => {
        expect(ip.isUrlRoutable('http://example.org')).toBeTruthy();
        expect(ip.isUrlRoutable('example.org')).toBeTruthy();
    });
});
