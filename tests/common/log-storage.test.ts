import {
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { LogStorage, type LogStorageInterface } from '../../src/common/log-storage/log-storage';
import { logStorageManager } from '../../src/common/log-storage/LogStorageManager';

describe('LogStorage', () => {
    let logStorage: LogStorageInterface;

    beforeEach(async () => {
        logStorage = new LogStorage();
        await logStorageManager.getStorage().clear();
    });

    it('Stores log in memory', async () => {
        logStorage.addLog('test1');
        expect(await logStorage.getLogsString()).toBe('"test1"');

        logStorage.addLog('test2');
        expect(logStorage.logs).toEqual(['"test2"']);
        expect(await logStorage.getLogsString()).toBe('"test1"\n"test2"');

        logStorage.addLog('test3');
        expect(logStorage.logs).toEqual(['"test2"', '"test3"']);
        expect(await logStorage.getLogsString()).toBe('"test1"\n"test2"\n"test3"');
    });

    it('Converts objects to strings', async () => {
        const obj = { test: 'test' };
        logStorage.addLog(obj);
        expect(await logStorage.getLogsString()).toBe(JSON.stringify(obj));
    });

    it('Adds multiple logs', async () => {
        const str1 = 'test1';
        const str2 = 'test2';
        logStorage.addLog(str1, str2);
        expect(await logStorage.getLogsString()).toBe(`"${str1}" "${str2}"`);
    });

    it('Does not get over max size limit', async () => {
        const str = 'testtest';

        const logStorageMaxElements = 10;

        const logStorage = new LogStorage(logStorageMaxElements, 1);

        for (let i = 0; i < 50; i += 1) {
            logStorage.addLog(str);
        }

        await new Promise((resolve) => {
            setTimeout(async () => {
                const savedValue = await logStorageManager.getStorage().get();
                expect(savedValue.length).toEqual(10);
                resolve(true);
            }, 100);
        });
    });
});
