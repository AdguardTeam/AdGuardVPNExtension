import {
    LogStorage,
    LOGS_STORAGE_KEY,
    LogStorageInterface,
    SAVE_STORAGE_LOGS_TIMEOUT,
} from '../../src/lib/log-storage';
import { browserApi } from '../../src/background/browserApi';

interface StorageInterface {
    [key: string]: any;
    set: jest.Mock<Promise<void>, [key: string, data: any]>;
    get: jest.Mock<Promise<string>, [key: string]>;
    remove: jest.Mock<Promise<boolean>, [key: string]>;
}

jest.mock('../../src/background/browserApi', () => {
    const storage: StorageInterface = {
        set: jest.fn(async (key: string, data: any): Promise<void> => {
            storage[key] = data;
        }),
        get: jest.fn(async (key: string): Promise<string> => {
            return storage[key];
        }),
        remove: jest.fn(async (key: string): Promise<boolean> => {
            return delete storage[key];
        }),
    };
    return {
        __esModule: true,
        browserApi: {
            storage,
        },
    };
});

describe('LogStorage', () => {
    let logStorage: LogStorageInterface;

    beforeEach(() => {
        logStorage = new LogStorage();
        browserApi.storage.remove(LOGS_STORAGE_KEY);
    });

    it('Stores log in memory', async () => {
        logStorage.addLog('test1');
        expect(await logStorage.getLogsString()).toBe('"test1"');
        expect(logStorage.size).toBe(new Blob(['"test1"']).size);

        logStorage.addLog('test2');
        expect(logStorage.logs).toEqual(['"test2"']);
        expect(await logStorage.getLogsString()).toBe('"test1"\n"test2"');
        expect(logStorage.size).toBe(
            new Blob(['"test1"']).size
            + new Blob(['"test2"']).size,
        );

        logStorage.addLog('test3');
        expect(logStorage.logs).toEqual(['"test2"', '"test3"']);
        expect(await logStorage.getLogsString()).toBe('"test1"\n"test2"\n"test3"');
        expect(logStorage.size).toBe(
            new Blob(['"test1"']).size
            + new Blob(['"test2"']).size
            + new Blob(['"test3"']).size,
        );
    });

    it('Converts objects to strings', async () => {
        const obj = { test: 'test' };
        logStorage.addLog(obj);
        expect(await logStorage.getLogsString()).toBe(JSON.stringify(obj));
        expect(logStorage.size).toBe(new Blob([JSON.stringify(obj)]).size);
    });

    it('Adds multiple logs', async () => {
        const str1 = 'test1';
        const str2 = 'test2';
        logStorage.addLog(str1, str2);
        expect(await logStorage.getLogsString()).toBe(`"${str1}" "${str2}"`);
        expect(logStorage.size).toBe(new Blob([`"${str1}" "${str2}"`]).size);
    });

    it('Does not get over max bytes limit', async (done) => {
        jest.setTimeout(10000);
        const str = 'testtest'; // 8Bytes
        expect(new Blob([str]).size).toBe(8);

        const logStorageMaxSizeBytes = 2 ** 10; // 1KB -> 1024Bytes

        const logStorage = new LogStorage(logStorageMaxSizeBytes);
        // we add 8 bytes 256 times = 256 * 8 -> 2KB
        for (let i = 0; i < 256; i += 1) {
            logStorage.addLog(str);
        }

        setTimeout(() => {
            expect(logStorage.size).toBeLessThanOrEqual(logStorageMaxSizeBytes);
            done();
        }, SAVE_STORAGE_LOGS_TIMEOUT);
    });
});
