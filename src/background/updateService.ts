import { browserApi } from './browserApi';
import { StateData } from './stateStorage';
import { StorageKey, type UpdateServiceState } from './schema';

const APP_VERSION_KEY = 'update.service.app.version';

export interface UpdateServiceInterface {
    /**
     * Whether this is the first run of the application.
     */
    isFirstRun: boolean;

    init(): Promise<void>;
    getAppVersionFromStorage(): Promise<string | undefined>;
    getAppVersionFromManifest(): Promise<string>;
    setAppVersionInStorage(appVersion: string): Promise<void>;
    setIsFirstRunFalse(): void;
}

class UpdateService implements UpdateServiceInterface {
    /**
     * Update service state data.
     * Used to save and retrieve update service state from session storage,
     * in order to persist it across service worker restarts.
     */
    private state = new StateData(StorageKey.UpdateServiceState);

    /** @inheritdoc */
    isFirstRun: boolean;

    isUpdate: boolean;

    init = async (): Promise<void> => {
        let { prevVersion, currentVersion } = await this.state.get();

        const partialStateToSave: Partial<UpdateServiceState> = {};

        if (!prevVersion) {
            prevVersion = await this.getAppVersionFromStorage();
            partialStateToSave.prevVersion = prevVersion;
        }

        if (!currentVersion) {
            currentVersion = await this.getAppVersionFromManifest();
            partialStateToSave.currentVersion = currentVersion;
        }

        if (Object.keys(partialStateToSave).length) {
            await this.state.set(partialStateToSave);
        }

        this.isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        this.isUpdate = !!(currentVersion !== prevVersion && prevVersion);

        await this.setAppVersionInStorage(currentVersion);
    };

    getAppVersionFromStorage = async (): Promise<string | undefined> => {
        return browserApi.storage.get(APP_VERSION_KEY);
    };

    getAppVersionFromManifest = async (): Promise<string> => {
        return browserApi.runtime.getManifest().version;
    };

    setAppVersionInStorage = async (appVersion: string): Promise<void> => {
        await this.state.set({ prevVersion: appVersion });
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };

    setIsFirstRunFalse = (): void => {
        this.isFirstRun = false;
    };
}

export const updateService = new UpdateService();
