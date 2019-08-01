import { proxy } from './proxy';

const getHostname = (url) => {
    const urlObj = new URL(url);
    return urlObj.hostname;
};

class Whitelist {
    constructor() {
        this.whitelistHostnames = [];
    }

    async addToWhitelist(url) {
        this.whitelistHostnames = [...this.whitelistHostnames, getHostname(url)];
        await proxy.setBypassWhitelist(this.whitelistHostnames);
    }

    async removeFromWhitelist(url) {
        this.whitelistHostnames = this.whitelistHostnames
            .filter(hostname => hostname !== getHostname(url));
        await proxy.setBypassWhitelist(this.whitelistHostnames);
    }

    isWhitelisted = async (url) => {
        if (url) {
            return this.whitelistHostnames.includes(getHostname(url));
        }
        return false;
    }
}

const whitelist = new Whitelist();

export default whitelist;
