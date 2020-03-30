import Exclusions from '../../src/background/exclusions/Exclusions';
import { sleep } from '../../src/lib/helpers';

const proxy = {
    setBypassList: jest.fn(() => {
    }),
};

const settings = (() => {
    let settingsStorage = {};
    return {
        setExclusions: jest.fn((data) => {
            settingsStorage = data;
        }),
        getExclusions: jest.fn(() => {
            return settingsStorage;
        }),
    };
})();

const browser = {
    runtime: {
        sendMessage: () => {
        },
    },
};

const exclusions = new Exclusions(browser, proxy, settings);

beforeAll(async (done) => {
    await exclusions.init();
    done();
});

describe('modules bound with exclusions work as expected', () => {
    afterAll(async (done) => {
        await exclusions.current.clearExclusions();
        done();
    });

    it('should be called once after initialization', async () => {
        expect(proxy.setBypassList).toHaveBeenCalledTimes(1);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
        await sleep(110);
        expect(settings.setExclusions).toHaveBeenCalledTimes(1);
    });

    it('should be called once when adding to index', async () => {
        await exclusions.current.addToExclusions('http://example.org');
        expect(proxy.setBypassList).toHaveBeenCalledTimes(2);
        expect(settings.setExclusions).toHaveBeenCalledTimes(2);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
    });

    it('should be called once when removing from index', async () => {
        const exclusionsList = exclusions.current.getExclusionsList();
        const exclusion = exclusionsList[0];
        await exclusions.current.removeFromExclusions(exclusion.id);
        expect(proxy.setBypassList).toHaveBeenCalledTimes(3);
        expect(settings.setExclusions).toHaveBeenCalledTimes(3);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
    });
});

describe('exclusions', () => {
    it('should be empty before initialization', () => {
        const currentList = exclusions.current.getExclusionsList();
        expect(currentList.length).toEqual(0);

        const blacklist = exclusions.blacklist.getExclusionsList();
        expect(blacklist.length).toEqual(0);

        const whitelist = exclusions.whitelist.getExclusionsList();
        expect(whitelist.length).toEqual(0);
    });

    it('current handler should fit to inverted status, and handle switch', async () => {
        const expectedType = exclusions.isInverted()
            ? exclusions.TYPES.WHITELIST
            : exclusions.TYPES.BLACKLIST;
        expect(exclusions.current.type).toBe(expectedType);

        await exclusions.setCurrentHandler(exclusions.TYPES.BLACKLIST);
        expect(exclusions.current.type).toBe(exclusions.TYPES.BLACKLIST);

        await exclusions.setCurrentHandler(exclusions.TYPES.WHITELIST);
        expect(exclusions.current.type).toBe(exclusions.TYPES.WHITELIST);
    });

    it('should return right type of handler', () => {
        expect(exclusions.blacklist.type).toBe(exclusions.TYPES.BLACKLIST);
        expect(exclusions.whitelist.type).toBe(exclusions.TYPES.WHITELIST);
    });

    it('should return false if hostname is NOT in exclusions', () => {
        expect(exclusions.current.isExcluded('http://example.org')).toEqual(false);
    });

    it('should return true if hostname was added in current', async () => {
        await exclusions.setCurrentHandler(exclusions.TYPES.BLACKLIST);

        let exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage).toEqual({
            inverted: false,
            blacklist: {},
            whitelist: {},
        });

        const blacklistedDomain = 'http://example.org/';
        await exclusions.current.addToExclusions(blacklistedDomain);
        expect(exclusions.current.isExcluded(blacklistedDomain)).toBeTruthy();

        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.whitelist).toEqual({});
        expect(exclusionsInStorage.inverted).toEqual(false);
        const hasDomain = Object.values(exclusionsInStorage.blacklist).some((val) => {
            return blacklistedDomain.includes(val.hostname);
        });
        expect(hasDomain).toBeTruthy();

        await exclusions.setCurrentHandler(exclusions.TYPES.WHITELIST);
        expect(exclusions.current.isExcluded(blacklistedDomain)).toBeFalsy();
        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.whitelist).toEqual({});
        expect(exclusionsInStorage.inverted).toEqual(true);

        const whitelistedDomain = 'http://yandex.ru/';
        await exclusions.current.addToExclusions(whitelistedDomain);
        expect(exclusions.current.isExcluded(whitelistedDomain)).toBeTruthy();

        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.inverted).toEqual(true);

        const hasWhitelistedDomain = Object.values(exclusionsInStorage.whitelist).some((val) => {
            return whitelistedDomain.includes(val.hostname);
        });
        expect(hasWhitelistedDomain).toBeTruthy();
    });
});

describe('urls w/ www and w/o www', () => {
    afterEach(async (done) => {
        await exclusions.current.clearExclusions();
        done();
    });

    it('can add strings and consider domains w/ and w/o www to be equal', async () => {
        await exclusions.current.addToExclusions('netflix.com');
        expect(exclusions.current.isExcluded('https://netflix.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.netflix.com')).toBeTruthy();

        await exclusions.current.addToExclusions('www.example.com');
        expect(exclusions.current.isExcluded('https://example.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.example.com')).toBeTruthy();

        await exclusions.current.addToExclusions('https://www.mail.com');
        expect(exclusions.current.isExcluded('https://mail.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.mail.com')).toBeTruthy();
    });

    it('do not add redundant exclusions', async () => {
        await exclusions.current.addToExclusions('https://netflix.com');
        expect(exclusions.current.getExclusionsList().length).toBe(1);
        await exclusions.current.addToExclusions('https://www.netflix.com');
        expect(exclusions.current.getExclusionsList().length).toBe(1);
    });
});

describe('works with wildcards', () => {
    it('finds simple wildcards', async () => {
        await exclusions.current.addToExclusions('*mail.com');
        expect(exclusions.current.isExcluded('https://mail.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.mail.com')).toBeTruthy();

        await exclusions.current.addToExclusions('*.adguard.com');
        expect(exclusions.current.isExcluded('https://bit.adguard.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://jira.adguard.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://bit.adguard.com/issues')).toBeTruthy();
    });
});
