import '@testing-library/jest-dom';

global.afterEach(async () => {
    await global.chrome.storage.session.clear();
});
