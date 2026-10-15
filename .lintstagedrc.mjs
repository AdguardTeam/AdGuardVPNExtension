export default {
    "*.{ts,tsx,js,jsx}": (filenames) => [
        `eslint --cache ${filenames.join(' ')}`,
    ],
    "{src,tasks}/**/*.{ts,tsx}": (filenames) => [
        `eslint --no-eslintrc --config .eslintrc.type-assertions.cjs ${filenames.join(' ')}`,
    ],
};
