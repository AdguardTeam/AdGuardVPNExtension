import { ExclusionsManager } from '../../src/background/exclusions/ExclusionsManager';

// TODO fine tune tsconfig.json
describe('ExclusionsManager', () => {
    it('unites services and exclusions', () => {
        const exclusionsManager = new ExclusionsManager();
        exclusionsManager.setExclusionsServices([
            {
                id: 'facebook',
                name: 'Facebook',
                domains: [
                    'facebook.com',
                    'facebook.net',
                ],
            },
        ]);
        exclusionsManager.addExclusion('facebook.com');
        const exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData).toBe({
            services: [{
                id: 'facebook',
                name: 'Facebook',
                enabled: true,
                exclusions: ['id1'],
            }],
            exclusions: [{ id: 'id1', name: 'facebook.com', enabled: true }],
        });
    });
});
