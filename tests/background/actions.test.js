import actions from '../../src/background/actions';
import credentials from '../../src/background/credentials';

jest.mock('../../src/background/credentials');
credentials.getUsername.mockImplementation(() => 'test@mail.com');

jest.mock('../../src/background/config', () => {
    return {
        UPGRADE_LICENSE_URL: 'https://adguard-vpn.com/forward.html?action=buy_license&from=popup&app=vpn_extension',
    };
});

describe('Actions tests', () => {
    it('Get premium promo page url', async () => {
        const expectedUrl = 'https://adguard-vpn.com/forward.html?action=buy_license&from=popup&app=vpn_extension&email=test%40mail.com';
        const url = await actions.getPremiumPromoPageUrl();
        expect(url).toEqual(expectedUrl);
    });
});
