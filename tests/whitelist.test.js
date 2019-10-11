import Whitelist from '../src/background/whitelist/whitelist';

const proxy = {
    setBypassWhitelist: jest.fn(() => {}),
};

const storage = (() => {
    let whitelistList = [];
    return {
        set: jest.fn((key, data) => {
            whitelistList = data;
        }),
        get: jest.fn(() => {
            return whitelistList;
        }),
    };
})();

const whitelist = new Whitelist(proxy, storage);

beforeAll(async (done) => {
    await whitelist.init();
    done();
});

describe('modules bound with whitelist', () => {
    it('should be called once after initialization', async () => {
        expect(proxy.setBypassWhitelist).toHaveBeenCalledTimes(1);
        expect(storage.get).toHaveBeenCalledTimes(1);
        expect(storage.set).toHaveBeenCalledTimes(1);
    });

    it('should be called once when adding to index', async () => {
        await whitelist.addToWhitelist('http://example.com');
        expect(proxy.setBypassWhitelist).toHaveBeenCalledTimes(2);
        expect(storage.set).toHaveBeenCalledTimes(2);
        expect(storage.get).toHaveBeenCalledTimes(1);
    });

    it('should be called once when removing from index', async () => {
        await whitelist.removeFromWhitelist('http://example.com');
        expect(proxy.setBypassWhitelist).toHaveBeenCalledTimes(3);
        expect(storage.set).toHaveBeenCalledTimes(3);
        expect(storage.get).toHaveBeenCalledTimes(1);
    });
});

describe('whitelist', () => {
    it('should be empty before initialization', () => {
        expect(whitelist.whitelisted.length).toEqual(0);
    });

    it('should return false if hostname is NOT whitelisted', () => {
        expect(whitelist.isWhitelisted('http://example.com')).toEqual(false);
    });

    it('should return true if hostname is whitelisted', async () => {
        await whitelist.addToWhitelist('http://example.com');
        expect(whitelist.isWhitelisted('http://example.com')).toEqual(true);
    });

    it('should add element correctly', () => {
        expect(whitelist.whitelisted.length).toEqual(1);
    });

    it('should return false if hostname is removed from whitelisted', async () => {
        await whitelist.removeFromWhitelist('http://example.com');
        expect(whitelist.isWhitelisted('http://example.com')).toEqual(false);
    });

    it('should remove element correctly', () => {
        expect(whitelist.whitelisted.length).toEqual(0);
    });
});
