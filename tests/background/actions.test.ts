import { actions } from '../../src/background/actions';
import { credentials } from '../../src/background/credentials';

jest.mock('../../src/background/browserApi');
jest.mock('../../src/background/credentials');
jest.mock('../../src/background/config', () => {
    return {
        // url example for test
        UPGRADE_LICENSE_URL: 'https://adguard-vpn.com/license.html?action=upgrade_license',
    };
});

describe('Actions tests', () => {
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
