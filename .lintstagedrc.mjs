export default {
    "*.{ts,tsx,js,jsx}": (filenames) => [
        `eslint --cache ${filenames.join(' ')}`,
    ],
};
