const NodeEnvironment = require('jest-environment-jsdom');
// @ts-ignore
const fetch = require('node-fetch');

/**
 * A custom environment to set the TextEncoder
 */
class CustomEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();
        if (typeof TextEncoder === 'undefined') { // required for node =10
            // eslint-disable-next-line global-require
            const { TextEncoder } = require('util');
            this.global.TextEncoder = TextEncoder;
        } else {
            this.global.TextEncoder = TextEncoder; // required for other node >10
        }
        this.global.__APP_CONFIG__ = {};
        // Fixes errors with fetch
        this.global.fetch = fetch;
        // @ts-ignore
        this.global.Request = fetch.Request;
    }
}

module.exports = CustomEnvironment;
