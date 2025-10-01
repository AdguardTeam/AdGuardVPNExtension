/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';
import type webpack from 'webpack';

import { version } from '../package.json';

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

// Configure the main program with global options
program
    .name('bundle')
    .description('Build AdGuard VPN extension for different browsers')
    .version(version)
    .option('-w, --watch', 'Builds in watch mode', false);

// Chrome command
program
    .command(Browser.Chrome)
    .description('Builds extension for Chrome browser')
    .action(async (options, command) => {
        const parentOptions = command.parent.opts();
        await createBundle(chromeConfig, parentOptions.watch);
    });

// Firefox command
program
    .command(Browser.Firefox)
    .description('Builds extension for Firefox browser')
    .action(async (options, command) => {
        const parentOptions = command.parent.opts();
        await createBundle(firefoxConfig, parentOptions.watch);

        if (IS_BETA) {
            await buildUpdateJson();
        }
    });

// Opera command
program
    .command(Browser.Opera)
    .description('Builds extension for Opera browser')
    .action(async (options, command) => {
        const parentOptions = command.parent.opts();
        await createBundle(operaConfig, parentOptions.watch);
    });

// Edge command
program
    .command(Browser.Edge)
    .description('Builds extension for Edge browser')
    .action(async (options, command) => {
        const parentOptions = command.parent.opts();
        await createBundle(edgeConfig, parentOptions.watch);
    });

// Default action - build all browsers
program
    .action(async (options) => {
        await createBundle(chromeConfig, options.watch);
        await createBundle(operaConfig, options.watch);
        await createBundle(edgeConfig, options.watch);

        // Firefox is not built with `pnpm beta` command
        // because we have separate plan for Firefox
        if (!IS_BETA) {
            await createBundle(firefoxConfig, options.watch);
        }
    });

program.parse(process.argv);
