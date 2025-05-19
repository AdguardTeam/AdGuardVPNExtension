/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';
import type webpack from 'webpack';

import { bundleRunner } from './bundle-runner';
import { chromeConfig } from './chrome/webpack.chrome';
import { firefoxConfig } from './firefox/webpack.firefox';
import { operaConfig } from './opera/webpack.opera';
import { edgeConfig } from './edge/webpack.edge';
import { Browser, IS_BETA } from './consts';
import { buildUpdateJson } from './firefox/update-json';

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
    await createBundle(operaConfig, program.watch);
    await createBundle(edgeConfig, program.watch);

    // Firefox is not built with `pnpm beta` command
    // because we have separate plan for Firefox
    if (!IS_BETA) {
        await createBundle(firefoxConfig, program.watch);
    }
};

program
    .option('--watch', 'Builds in watch mode', false);

program
    .command(Browser.Chrome)
    .description('Builds extension for chrome browser')
    .action(async () => {
        await createBundle(chromeConfig, program.watch);
    });

program
    .command(Browser.Firefox)
    .description('Builds extension for firefox browser')
    .action(async () => {
        await createBundle(firefoxConfig, program.watch);

        if (IS_BETA) {
            await buildUpdateJson();
        }
    });

program
    .command(Browser.Opera)
    .description('Builds extension for firefox browser')
    .action(async () => {
        await createBundle(operaConfig, program.watch);
    });

program
    .command(Browser.Edge)
    .description('Builds extension for firefox browser')
    .action(async () => {
        await createBundle(edgeConfig, program.watch);
    });

program
    .description('By default builds for all platforms')
    .action(buildAllBrowsers);

program.parse(process.argv);
