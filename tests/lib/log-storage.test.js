import { LogStorage } from '../../src/lib/log-storage';

describe('LogStorage', () => {
    let logStorage;

    beforeEach(() => {
        logStorage = new LogStorage();
    });

    it('Stores log in memory', () => {
        logStorage.addLog('test');
        expect(logStorage.toString()).toBe('"test"');
        expect(logStorage.size).toBe(new Blob(['"test"']).size);

        logStorage.addLog('test2');
        expect(logStorage.toString()).toBe('"test"\n"test2"');
        expect(logStorage.size).toBe(new Blob(['"test"']).size + new Blob(['"test2"']).size);
    });

    it('Converts objects to strings', () => {
        const obj = { test: 'test' };
        logStorage.addLog(obj);
        expect(logStorage.toString()).toBe(JSON.stringify(obj));
        expect(logStorage.size).toBe(new Blob([JSON.stringify(obj)]).size);
    });

    it('Adds multiple logs', () => {
        const str1 = 'test1';
        const str2 = 'test2';
        logStorage.addLog(str1, str2);
        expect(logStorage.toString()).toBe(`"${str1}", "${str2}"`);
        expect(logStorage.size).toBe(new Blob([`"${str1}", "${str2}"`]).size);
    });

    it('Does not get over max bytes limit', () => {
        const str = 'testtest'; // 8Bytes
        expect(new Blob([str]).size).toBe(8);

        const logStorageMaxSizeBytes = 2 ** 10; // 1KB -> 1024Bytes

        const logStorage = new LogStorage(logStorageMaxSizeBytes);
        // we add 8 bytes 256 times = 256 * 8 -> 2KB
        for (let i = 0; i < 256; i += 1) {
            logStorage.addLog(str);
        }

        expect(logStorage.size).toBeLessThanOrEqual(logStorageMaxSizeBytes);
    });
});
