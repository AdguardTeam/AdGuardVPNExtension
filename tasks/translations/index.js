/* eslint-disable no-await-in-loop */
require('@babel/register');

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

const { downloadAndSave } = require('./download');
const { uploadBaseLocale } = require('./upload');
const { validateMessages, checkTranslations } = require('./validate');
const { checkUnusedMessages } = require('./unused');

const { log } = require('./helpers');

const {
    TWOSKY_CONFIG_PATH,
    REQUIRED_LOCALES,
} = require('./locales-constants');

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const { languages: LANGUAGES } = twoskyConfig;
const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded

const download = async (locales) => {
    try {
        await downloadAndSave(locales);
        log.success('Download was successful');
        await validateMessages(locales);
        await checkTranslations(REQUIRED_LOCALES);
    } catch (e) {
        log.error(e.message);
        process.exit(1);
    }
};

const upload = async () => {
    try {
        // check for unused base-locale strings before uploading
        await checkUnusedMessages();
        const result = await uploadBaseLocale();
        log.success(`Upload was successful with response: ${JSON.stringify(result)}`);
    } catch (e) {
        log.error(e.message);
        process.exit(1);
    }
};

const validate = async (locales) => {
    try {
        await validateMessages(locales);
        await checkTranslations(REQUIRED_LOCALES);
    } catch (e) {
        log.error(e.message);
        process.exit(1);
    }
};

const summary = async (isInfo) => {
    try {
        await checkTranslations(LOCALES, isInfo);
    } catch (e) {
        log.error(e.message);
        process.exit(1);
    }
};

const unused = async (isInfo) => {
    try {
        await checkUnusedMessages(isInfo);
    } catch (e) {
        log.error(e.message);
        process.exit(1);
    }
};

program
    .command('download')
    .description('Downloads messages from localization service')
    .option('-l,--locales [list...]', 'specific list of space-separated locales')
    .action((opts) => {
        const locales = opts.locales && opts.locales.length > 0 ? opts.locales : LOCALES;
        download(locales);
    });

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program
    .command('validate')
    .description('Validates translations')
    .option('-R,--min', 'for only our required locales')
    .option('-l,--locales [list...]', 'for specific list of space-separated locales')
    .action((opts) => {
        let locales;
        if (opts.min) {
            locales = REQUIRED_LOCALES;
        } else if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
        } else {
            // defaults to validate all locales
            locales = LOCALES;
        }
        validate(locales);
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
            unused(IS_INFO);
        } else if (!opts.summary && !opts.unused) {
            summary(IS_INFO);
            unused(IS_INFO);
        }
    });

program.parse(process.argv);
