import browser from 'webextension-polyfill';

class Background {
    constructor() {
        this.backgroundContext = null;
    }

    async getBackgroundContext() {
        if (!this.backgroundContext) {
            try {
                const backgroundWindow = await browser.runtime.getBackgroundPage();
                this.backgroundContext = backgroundWindow.background;
            } catch (e) {
                console.log(e.message);
            }
        }
        return Promise.resolve(this.backgroundContext);
    }

    async getSettings() {
        const backgroundContext = await this.getBackgroundContext();
        return backgroundContext.settings;
    }
}

const background = new Background();

export default background;
