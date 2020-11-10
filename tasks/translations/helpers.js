/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

export const log = {
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
 * @param {string} localesDir
 * @param {string} locale
 * @param {string} localesDataFilename
 * @returns {Object}
 */
export const getLocaleMessages = async (localesDir, locale, localesDataFilename) => {
    const filePath = path.join(localesDir, locale, localesDataFilename);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Compares two arrays
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {boolean}
 */
export const areArraysEqual = (arr1, arr2) => {
    if (!arr1 || !arr2) {
        return false;
    }
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i += 1) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};
