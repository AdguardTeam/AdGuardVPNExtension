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
export const readMessagesByLocale = async (locale) => {
    const filePath = path.join(LOCALES_ABSOLUTE_PATH, locale, LOCALE_DATA_FILENAME);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Save file by path with passed content
 * @param {Object} messages
 * @param {string} locale
 */
export const writeMessagesByLocale = async (messages, locale) => {
    const localePath = path.join(LOCALES_ABSOLUTE_PATH, locale, LOCALE_DATA_FILENAME);
    const messagesString = JSON.stringify(messages, null, 4);
    await fs.promises.writeFile(localePath, messagesString);
};
