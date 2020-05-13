const NodeEnvironment = require('jest-environment-jsdom');

/**
 * A custom environment to set the TextEncoder
 */
class CustomEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();
        this.global.TextEncoder = TextEncoder;
        this.global.PRODUCTION = false;
    }
}

module.exports = CustomEnvironment;
