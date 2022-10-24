/* eslint-disable no-console,no-restricted-syntax,no-await-in-loop */
import { program } from 'commander';

import { bundleRunner } from './bundle-runner';
import chromeConfig from './chrome/webpack.chrome';
import firefoxConfig from './firefox/webpack.firefox';
import operaConfig from './opera/webpack.opera';
import edgeConfig from './edge/webpack.edge';
import { BROWSERS } from './consts';

const createBundle = async (config, watch) => {
    try {
        await bundleRunner(config, watch);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

const buildAllBrowsers = async () => {
    await createBundle(chromeConfig, program.watch);
    await createBundle(firefoxConfig, program.watch);
    await createBundle(operaConfig, program.watch);
    await createBundle(edgeConfig, program.watch);
};

program
    .option('--watch', 'Builds in watch mode', false);

program
    .command(BROWSERS.CHROME)
    .description('Builds extension for chrome browser')
    .action(() => {
        createBundle(chromeConfig, program.watch);
    });

program
    .command(BROWSERS.FIREFOX)
    .description('Builds extension for firefox browser')
    .action(() => {
        createBundle(firefoxConfig, program.watch);
    });

program
    .command(BROWSERS.OPERA)
    .description('Builds extension for firefox browser')
    .action(() => {
        createBundle(operaConfig, program.watch);
    });

program
    .command(BROWSERS.EDGE)
    .description('Builds extension for firefox browser')
    .action(() => {
        createBundle(edgeConfig, program.watch);
    });

program
    .description('By default builds for all platforms')
    .action(buildAllBrowsers);

program.parse(process.argv);
