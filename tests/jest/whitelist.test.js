import Whitelist from '../../src/background/_whitelist';

const {
    describe, it, expect,
} = global;

let jest;
const proxy = {
    setBypassWhitelist: jest.fn(() => {
    }),
};

const whitelist = new Whitelist(proxy);

describe('whitelist.proxy.setBypassWhitelist', () => {
    it('should NOT be called before initialization', async () => {
        expect(whitelist.proxy.setBypassWhitelist)
            .toHaveBeenCalledTimes(0);
    });
    it('should be called once when adding to whitelist', async () => {
        await whitelist.addToWhitelist('http://example.com');
        expect(whitelist.proxy.setBypassWhitelist)
            .toHaveBeenCalledTimes(1);
    });
    it('should be called once when removing from whitelist', async () => {
        await whitelist.removeFromWhitelist('http://example.com');
        expect(whitelist.proxy.setBypassWhitelist)
            .toHaveBeenCalledTimes(2);
    });
});

describe('whitelist', () => {
    it('should be empty before initialization', () => {
        expect(whitelist.whitelisted.length)
            .toEqual(0);
    });

    it('should return false if hostname is NOT whitelisted', async () => {
        expect(await whitelist.isWhitelisted('http://example.com'))
            .toEqual(false);
    });

    it('should return true if hostname is whitelisted', async () => {
        await whitelist.addToWhitelist('http://example.com');

        expect(await whitelist.isWhitelisted('http://example.com'))
            .toEqual((true));
    });

    it('should add element correctly', () => {
        expect(whitelist.whitelisted.length)
            .toEqual(1);
    });

    it('should return false if hostname is removed from whitelisted', async () => {
        await whitelist.removeFromWhitelist('http://example.com');
        expect(await whitelist.isWhitelisted('http://example.com'))
            .toEqual(false);
    });

    it('should remove element correctly', () => {
        expect(whitelist.whitelisted.length)
            .toEqual(0);
    });
});
