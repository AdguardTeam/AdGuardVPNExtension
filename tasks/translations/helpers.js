/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import {
    LOCALES_ABSOLUTE_PATH,
    LOCALE_DATA_FILENAME,
} from './locales-constants';

export const cliLog = {
    info: (str) => {
        console.log(str);
    },
    success: (str) => {
        console.log(chalk.green.bgBlack(str));
    },
    warning: (str) => {
        console.log(chalk.black.bgYellowBright(str));
    },
    error: (str) => {
        console.log(chalk.bold.yellow.bgRed(str));
    },
};

/**
 * Gets strings for certain locale
 * @param {string} locale
 * @returns {Object}
 */
export const getLocaleMessages = async (locale) => {
    const filePath = path.join(LOCALES_ABSOLUTE_PATH, locale, LOCALE_DATA_FILENAME);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};
