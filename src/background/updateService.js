import browserApi from './browserApi';

const APP_VERSION_KEY = 'update.service.app.version';

class UpdateService {
    constructor() {
        if (UpdateService.instance) {
            return UpdateService.instance;
        }
        UpdateService.instance = this;
    }

    init = async () => {
        this.prevVersion = await this.getAppVersionFromStorage();
        this.currentVersion = await this.getAppVersionFromManifest();

        this.isFirstRun = (this.currentVersion !== this.prevVersion && !this.prevVersion);
        this.isUpdate = !!(this.currentVersion !== this.prevVersion && this.prevVersion);

        await this.setAppVersionInStorage(this.currentVersion);
    }

    getAppVersionFromStorage = async () => {
        return browserApi.storage.get(APP_VERSION_KEY);
    };

    getAppVersionFromManifest = async () => {
        return browserApi.runtime.getManifest().version;
    };

    setAppVersionInStorage = async (appVersion) => {
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };
}

const updateService = new UpdateService();

export {
    updateService,
};
