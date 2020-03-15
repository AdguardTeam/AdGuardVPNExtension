const NodeEnvironment = require('jest-environment-node');

/**
 * A custom environment to set the TextEncoder that is required by TensorFlow.js.
 */
class CustomEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();
        if (typeof TextEncoder === 'undefined') {
            // eslint-disable-next-line global-require
            const { TextEncoder } = require('util');
            this.global.TextEncoder = TextEncoder;
        }
    }
}

module.exports = CustomEnvironment;
