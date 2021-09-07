/* eslint-disable no-await-in-loop */
import { program } from 'commander';

import { downloadAndSave } from './download';
import { uploadBaseLocale } from './upload';
import { checkTranslations } from './validate';
import { checkUnusedMessages } from './unused';

import { cliLog } from './helpers';

import { LANGUAGES } from './locales-constants';

const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded

const download = async (locales) => {
    try {
        await downloadAndSave(locales);
        cliLog.success('Download was successful');
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const upload = async () => {
    try {
        // check for unused base-locale strings before uploading
        await checkUnusedMessages();
        const result = await uploadBaseLocale();
        cliLog.success(`Upload was successful with response: ${JSON.stringify(result)}`);
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const validate = async (locales, isMinimum) => {
    try {
        await checkTranslations(locales, { isMinimum });
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const summary = async (isInfo) => {
    try {
        await checkTranslations(LOCALES, { isInfo });
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

const unused = async () => {
    try {
        await checkUnusedMessages();
    } catch (e) {
        cliLog.error(e.message);
        process.exit(1);
    }
};

program
    .command('download')
    .description('Downloads messages from localization service')
    .option('-l,--locales [list...]', 'specific list of space-separated locales')
    .action(async (opts) => {
        // defaults to download all locales
        // and validate: all for critical errors and ours for full translations readiness
        let locales = LOCALES;
        let isMinimum = true;
        // but if list_of_locales is specified, use them for download and validation
        if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
            isMinimum = false;
        }
        await download(locales);
        await validate(locales, isMinimum);
    });

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program
    .command('validate')
    .description('Validates translations')
    .option('-R,--min', 'for critical errors of all locales and translations readiness of ours')
    .option('-l,--locales [list...]', 'for specific list of space-separated locales')
    .action((opts) => {
        // defaults to validate all locales
        let locales = LOCALES;
        let isMinimum;
        if (opts.min) {
            isMinimum = true;
        } else if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
        }
        validate(locales, isMinimum);
    });

program
    .command('info')
    .description('Shows locales info')
    .option('-s,--summary', 'for all locales translations readiness')
    .option('-N,--unused', 'for unused base-lang strings')
    .action((opts) => {
        const IS_INFO = true;
        if (opts.summary) {
            summary(IS_INFO);
        } else if (opts.unused) {
            unused();
        } else if (!opts.summary && !opts.unused) {
            summary(IS_INFO);
            unused();
        }
    });

program.parse(process.argv);
