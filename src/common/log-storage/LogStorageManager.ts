import { notifier } from '../notifier';
import { SETTINGS_IDS } from '../constants';

import { type LogStorageProvider } from './storageProvider/LogStorageProvider';
import { BrowserLogStorageProvider } from './storageProvider/browserProvider';
import { MemoryLogStorageProvider } from './storageProvider/memoryProvider';

/**
 * Manages the storage mechanism for logs, allowing for dynamic switching
 * between different storage providers based on the debug mode setting.
 * We store logs to facilitate exporting when a user sends logs to the server.
 * Storing logs in memory is unsuitable for manifest v3 extensions, as they reload frequently.
 * Therefore, we also use browser storage, which preserves logs across reloads.
 */
class LogStorageManager {
    private currentStorage: LogStorageProvider;

    /**
     * Creates a new instance of the LogStorageManager.
     *
     * @param {LogStorageProvider} storage - The initial storage provider to use.
     */
    constructor(storage: LogStorageProvider) {
        this.currentStorage = storage;
        this.checkAndSwitchStorage = this.checkAndSwitchStorage.bind(this);

        // Listen for changes in the debug mode setting and switch storage accordingly.
        notifier.addSpecifiedListener(notifier.types.SETTING_UPDATED, async (settingId, value) => {
            if (settingId === SETTINGS_IDS.DEBUG_MODE_ENABLED) {
                await this.checkAndSwitchStorage(value);
            }
        });
    }

    /**
     * Checks the debug mode setting and switches the storage provider if necessary.
     * If a switch occurs, logs from the old provider are transferred to the new provider.
     *
     * @param {boolean} isDebugModeEnabled - Indicates if debug mode is enabled.
     */
    public async checkAndSwitchStorage(isDebugModeEnabled: boolean): Promise<void> {
        const newStorage = isDebugModeEnabled ? new BrowserLogStorageProvider() : new MemoryLogStorageProvider();
        if (!(this.currentStorage instanceof newStorage.constructor)) {
            const currentLogs = await this.currentStorage.get();

            // Retrieve logs from the new storage before switching:
            // - For BrowserLogStorageProvider: This ensures we don't lose logs during service worker restarts.
            // - For MemoryLogStorageProvider: Typically returns an empty array as it starts fresh.
            const oldLogs = await newStorage.get();

            const logs = oldLogs.concat(currentLogs);
            await this.currentStorage.clear();
            this.currentStorage = newStorage;
            await this.currentStorage.set(logs);
        }
    }

    /**
     * Retrieves the current storage provider.
     *
     * @returns {LogStorageProvider} - The current storage provider.
     */
    public getStorage(): LogStorageProvider {
        return this.currentStorage;
    }
}

/**
 * Default instance of the LogStorageManager, initialized with MemoryLogStorageProvider.
 */
export const logStorageManager = new LogStorageManager(new MemoryLogStorageProvider());
