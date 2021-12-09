import { sleep } from '../../src/lib/helpers';
import { services } from '../../src/background/exclusions/services/Services';
import ExclusionsManager, { ExclusionsInfo } from '../../src/background/exclusions/Exclusions';
import { ExclusionsModes } from '../../src/common/exclusionsConstants';

jest.mock('../../src/background/exclusions/ServicesManager');

const initMock = services.init as jest.MockedFunction<() => Promise<void>>;
initMock.mockImplementation(() => new Promise(() => {}));

jest.mock('../../src/lib/logger');

const proxy = {
    setBypassList: jest.fn(() => {
    }),
};

const settings = (() => {
    let settingsStorage = {
        inverted: false,
        [ExclusionsModes.Selective]: {
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        },
        [ExclusionsModes.Regular]: {
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        },
    };
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

const exclusions = new ExclusionsManager(browser, proxy, settings);

beforeAll(async () => {
    await exclusions.init();
});

describe('modules bound with exclusions work as expected', () => {
    afterAll(async () => {
        await exclusions.current.clearExclusionsData();
    });

    it('should be called once after initialization', async () => {
        expect(proxy.setBypassList).toHaveBeenCalledTimes(1);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
        await sleep(110);
        expect(settings.setExclusions).toHaveBeenCalledTimes(1);
    });

    it('should be called once when adding to index', async () => {
        await exclusions.current.addUrlToExclusions('http://example.org');
        expect(proxy.setBypassList).toHaveBeenCalledTimes(2);
        expect(settings.setExclusions).toHaveBeenCalledTimes(2);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
    });

    it('should be called once when removing from index', async () => {
        const exclusionsData = exclusions.current.getExclusions();
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        const exclusion = exclusionsData.exclusionsGroups[0];
        await exclusions.current.removeExclusionsGroup(exclusion.id);
        expect(proxy.setBypassList).toHaveBeenCalledTimes(3);
        expect(settings.setExclusions).toHaveBeenCalledTimes(3);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
    });

    it('should be called once when clearing index', async () => {
        await exclusions.current.clearExclusionsData();
        expect(proxy.setBypassList).toHaveBeenCalledTimes(4);
        expect(settings.setExclusions).toHaveBeenCalledTimes(4);
        expect(settings.getExclusions).toHaveBeenCalledTimes(1);
    });
});

describe('exclusions', () => {
    it('should be empty before initialization', () => {
        const exclusionsData = exclusions.current.getExclusions();
        expect(exclusionsData.excludedIps).toHaveLength(0);
        expect(exclusionsData.exclusionsGroups).toHaveLength(0);
        expect(exclusionsData.excludedServices).toHaveLength(0);

        const regular = exclusions.regular.getExclusions();
        expect(regular.excludedIps).toHaveLength(0);
        expect(regular.exclusionsGroups).toHaveLength(0);
        expect(regular.excludedServices).toHaveLength(0);

        const selective = exclusions.selective.getExclusions();
        expect(selective.excludedIps).toHaveLength(0);
        expect(selective.exclusionsGroups).toHaveLength(0);
        expect(selective.excludedServices).toHaveLength(0);
    });

    it('current handler should fit to inverted status, and handle switch', async () => {
        const expectedMode = exclusions.isInverted()
            ? exclusions.MODES.Selective
            : exclusions.MODES.Regular;
        expect(exclusions.current.mode).toBe(expectedMode);

        await exclusions.setCurrentMode(exclusions.MODES.Regular);
        expect(exclusions.current.mode).toBe(exclusions.MODES.Regular);

        await exclusions.setCurrentMode(exclusions.MODES.Selective);
        expect(exclusions.current.mode).toBe(exclusions.MODES.Selective);
    });

    it('should return right mode of handler', () => {
        expect(exclusions.regular.mode).toBe(exclusions.MODES.Regular);
        expect(exclusions.selective.mode).toBe(exclusions.MODES.Selective);
    });

    it('should return false if hostname is NOT in exclusions', () => {
        expect(exclusions.current.isExcluded('http://example.org')).toEqual(false);
    });

    it('should return true if hostname was added in current', async () => {
        await exclusions.setCurrentMode(exclusions.MODES.Regular);

        let exclusionsInStorage: ExclusionsInfo = settings.getExclusions();

        expect(exclusionsInStorage).toEqual({
            inverted: false,
            regular: {
                excludedServices: [],
                exclusionsGroups: [],
                excludedIps: [],
            },
            selective: {
                excludedServices: [],
                exclusionsGroups: [],
                excludedIps: [],
            },
        });

        const blacklistedDomain = 'http://example.org/';
        await exclusions.current.addUrlToExclusions(blacklistedDomain);
        expect(exclusions.current.isExcluded(blacklistedDomain)).toBeTruthy();

        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.selective).toEqual({
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        });
        expect(exclusionsInStorage.inverted).toEqual(false);
        const hasDomain = exclusionsInStorage.regular.exclusionsGroups
            .some((group) => blacklistedDomain.includes(group.hostname));
        expect(hasDomain).toBeTruthy();

        await exclusions.setCurrentMode(exclusions.MODES.Selective);
        expect(exclusions.current.isExcluded(blacklistedDomain)).toBeFalsy();
        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.selective).toEqual({
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        });
        expect(exclusionsInStorage.inverted).toEqual(true);

        const whitelistedDomain = 'http://yandex.ru/';
        await exclusions.current.addUrlToExclusions(whitelistedDomain);
        expect(exclusions.current.isExcluded(whitelistedDomain)).toBeTruthy();

        exclusionsInStorage = settings.getExclusions();
        expect(exclusionsInStorage.inverted).toEqual(true);

        const hasWhitelistedDomain = exclusionsInStorage.selective.exclusionsGroups
            .some((group) => whitelistedDomain.includes(group.hostname));
        expect(hasWhitelistedDomain).toBeTruthy();
    });
});

describe('urls w/ www and w/o www', () => {
    afterEach(async () => {
        await exclusions.current.clearExclusionsData();
    });

    it('can add strings and consider domains w/ and w/o www to be equal', async () => {
        await exclusions.current.addUrlToExclusions('test.com');
        expect(exclusions.current.isExcluded('https://test.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.test.com')).toBeTruthy();

        await exclusions.current.addUrlToExclusions('www.example.com');
        expect(exclusions.current.isExcluded('https://example.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.example.com')).toBeTruthy();

        await exclusions.current.addUrlToExclusions('https://www.mail.com');
        expect(exclusions.current.isExcluded('https://mail.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.mail.com')).toBeTruthy();
    });

    it('do not add redundant exclusions', async () => {
        await exclusions.current.addUrlToExclusions('https://example.org');
        expect(exclusions.current.getExclusions().exclusionsGroups).toHaveLength(1);
        await exclusions.current.addUrlToExclusions('https://www.example.org');
        expect(exclusions.current.getExclusions().exclusionsGroups).toHaveLength(1);
    });
});

describe('works with wildcards', () => {
    afterEach(async () => {
        await exclusions.current.clearExclusionsData();
    });

    it('finds simple wildcards', async () => {
        await exclusions.current.addUrlToExclusions('*mail.com');
        expect(exclusions.current.isExcluded('https://mail.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://www.mail.com')).toBeTruthy();

        await exclusions.current.addUrlToExclusions('*.adguard.com');
        expect(exclusions.current.isExcluded('https://bit.adguard.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://jira.adguard.com')).toBeTruthy();
        expect(exclusions.current.isExcluded('https://bit.adguard.com/issues')).toBeTruthy();
    });
});

describe('Exclusions order', () => {
    afterEach(async () => {
        await exclusions.current.clearExclusionsData();
    });

    it('exclusions order doesn\'t change after adding new exclusion', async () => {
        await exclusions.current.addUrlToExclusions('https://test1.com');
        await exclusions.current.addUrlToExclusions('a-test.com');
        await exclusions.current.addUrlToExclusions('https://3test.com');
        const { exclusionsGroups } = exclusions.current.getExclusions();

        expect(exclusionsGroups.length).toBe(3);
        expect(exclusionsGroups[0].hostname).toBe('test1.com');
        expect(exclusionsGroups[1].hostname).toBe('a-test.com');
        expect(exclusionsGroups[2].hostname).toBe('3test.com');
    });
});
