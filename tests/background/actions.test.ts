import { actions, buildQueryString } from '../../src/background/actions';
import { credentials } from '../../src/background/credentials';
// TODO: test mv3 after official switch to mv3
import { stateStorage } from '../../src/background/stateStorage/mv2';

jest.mock('../../src/background/stateStorage', () => {
    // eslint-disable-next-line global-require
    return require('../../src/background/stateStorage/mv2');
});

jest.mock('../../src/background/browserApi');
jest.mock('../../src/background/credentials');
jest.mock('../../src/background/config', () => {
    return {
        // url example for test
        UPGRADE_LICENSE_URL: 'https://adguard-vpn.com/license.html?action=upgrade_license',
    };
});

describe('Actions tests', () => {
    beforeEach(async () => {
        await stateStorage.init();
    });

    it('Get premium promo page url', async () => {
        const getUsernameMock = credentials.getUsername as jest.MockedFunction<() => any>;
        getUsernameMock.mockImplementation(() => 'test@mail.com');

        const expectedUrl = 'https://adguard-vpn.com/license.html?action=upgrade_license&email=test%40mail.com';
        const url = await actions.getPremiumPromoPageUrl();
        getUsernameMock.mockClear();
        expect(url).toEqual(expectedUrl);
    });

    it('Test email with special symbols', async () => {
        const getUsernameMock = credentials.getUsername as jest.MockedFunction<() => any>;
        getUsernameMock.mockImplementation(() => 'tester+000@test.com');

        const expectedUrl = 'https://adguard-vpn.com/license.html?action=upgrade_license&email=tester%2B000%40test.com';
        const url = await actions.getPremiumPromoPageUrl();
        getUsernameMock.mockClear();
        expect(url).toEqual(expectedUrl);
    });
});

describe('buildQueryString', () => {
    it('should return an empty string if params are not provided', () => {
        const result = buildQueryString({});
        expect(result).toBe('');
    });

    it('should return only the query string if no anchorName is provided', () => {
        const params = {
            queryParams: {
                key1: 'value1',
                key2: 'value2',
            },
        };
        const result = buildQueryString(params);
        expect(result).toBe('?key1=value1&key2=value2');
    });

    it('should return only the anchor if no queryParams are provided', () => {
        const params = {
            anchorName: 'testAnchor',
        };
        const result = buildQueryString(params);
        expect(result).toBe('#testAnchor');
    });

    it('should return the combined query string and anchor if both are provided', () => {
        const params = {
            anchorName: 'testAnchor',
            queryParams: {
                key1: 'value1',
                key2: 'value2',
            },
        };
        const result = buildQueryString(params);
        expect(result).toBe('?key1=value1&key2=value2#testAnchor');
    });
});
