import { ABTestManager } from '../../../src/background/abTestManager/ABTestManager';
import { browserApi } from '../../../src/background/browserApi';
import { log } from '../../../src/lib/logger';

jest.mock('../../../src/background/browserApi', () => {
    // eslint-disable-next-line global-require
    return require('../../__mocks__/browserApiMock');
});

jest.mock('../../../src/lib/logger');

describe('ABTestManager', () => {
    afterEach(() => {
        jest.resetAllMocks(); // Reset all mocks after each test
    });

    describe('getExperiments', () => {
        it('should return comma separated experiments', () => {
            const experiments = ['exp1', 'exp2', 'exp3'];
            const manager = new ABTestManager(experiments);

            const result = manager.getExperiments();

            expect(result).toBe('exp1,exp2,exp3');
        });
    });

    describe('setVersions', () => {
        it('should set versions and save them to storage', async () => {
            const experiments = { versions: ['v1', 'v2'] };
            const manager = new ABTestManager([]);

            await manager.setVersions(experiments);

            expect(manager.versions).toEqual(['v1', 'v2']);
            expect(browserApi.storage.set).toHaveBeenCalledWith(ABTestManager.VERSIONS_STORAGE_KEY, ['v1', 'v2']);
        });
    });

    describe('getVersionsFromStorage', () => {
        it('should parse versions from storage', async () => {
            const storedVersions = ['v1', 'v2'];
            // @ts-ignore
            browserApi.storage.get.mockResolvedValue(storedVersions);

            const manager = new ABTestManager([]);
            const result = await manager.getVersionsFromStorage();

            expect(result).toEqual(storedVersions);
        });

        it('should log error and return default versions on parsing failure', async () => {
            // @ts-ignore
            browserApi.storage.get.mockResolvedValue('invalid');

            const manager = new ABTestManager([]);
            const result = await manager.getVersionsFromStorage();

            expect(log.error).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });
});
