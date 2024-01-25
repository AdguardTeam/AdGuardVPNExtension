export default {
    '*.{ts,tsx,js,jsx}': (fileNames) => `eslint --cache ${fileNames}`,
}
