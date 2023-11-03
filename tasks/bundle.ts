/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';
import webpack from 'webpack';

import { bundleRunner } from './bundle-runner';
import { chromeConfig } from './chrome/webpack.chrome';
import { chromeConfigMV2 } from './chrome-mv2/webpack.chrome-mv2';
import { firefoxConfigMV2 } from './firefox-mv2/webpack.firefox-mv2';
import { firefoxConfig } from './firefox/webpack.firefox';
import { operaConfig } from './opera/webpack.opera';
import { edgeConfig } from './edge/webpack.edge';
import { Browser } from './consts';

const createBundle = async (config: webpack.Configuration, watch: boolean): Promise<void> => {
    try {
        await bundleRunner(config, watch);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const buildAllBrowsers = async (): Promise<void> => {
    await createBundle(chromeConfig, program.watch);
    await createBundle(chromeConfigMV2, program.watch);
    await createBundle(firefoxConfigMV2, program.watch);
    await createBundle(firefoxConfig, program.watch);
    await createBundle(operaConfig, program.watch);
    await createBundle(edgeConfig, program.watch);
};

program
    .option('--watch', 'Builds in watch mode', false);

program
    .command(Browser.Chrome)
    .description('Builds extension for chrome browser with manifest version 3')
    .action(() => {
        createBundle(chromeConfig, program.watch);
    });

program
    .command(Browser.ChromeMV2)
    .description('Builds extension for chrome browser with manifest version 2')
    .action(() => {
        createBundle(chromeConfigMV2, program.watch);
    });

program
    .command(Browser.FirefoxMV2)
    .description('Builds extension for firefox browser with manifest version 2')
    .action(() => {
        createBundle(firefoxConfigMV2, program.watch);
    });

program
    .command(Browser.Firefox)
    .description('Builds extension for firefox browser with manifest version 3')
    .action(() => {
        createBundle(firefoxConfig, program.watch);
    });

program
    .command(Browser.Opera)
    .description('Builds extension for firefox browser')
    .action(() => {
        createBundle(operaConfig, program.watch);
    });

program
    .command(Browser.Edge)
    .description('Builds extension for firefox browser')
    .action(() => {
        createBundle(edgeConfig, program.watch);
    });

program
    .description('By default builds for all platforms')
    .action(buildAllBrowsers);

program.parse(process.argv);
