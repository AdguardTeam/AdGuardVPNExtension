// --- CLI argument parsing with commander ---
import { program } from 'commander';

import {
    Browser,
    Env,
    isValidBrowserTarget,
    isValidBuildEnv,
} from '../consts';

import { DEFAULT_SIZE_THRESHOLD_PERCENTAGE } from './constants';
import { checkBundleSizes } from './check';
import { updateBundleSize } from './update';

enum CheckerAction {
    Update = 'update',
    Check = 'check',
}

program
    .argument('<action>', 'Action to perform, one from: check, update')
    .argument('<buildEnv>', `Build environment, one from: ${Object.values(Env).map((s) => `"${s}"`).join(', ')}`)
    .argument('[targetBrowser]', `Target browser, one from: ${Object.values(Browser).map((s) => `"${s}"`).join(', ')}`)
    .option('--threshold <number>', 'Bundle size threshold in percents', String(DEFAULT_SIZE_THRESHOLD_PERCENTAGE))
    .action(async (
        action: CheckerAction,
        buildEnv: any,
        targetBrowser: Browser | undefined,
        options: {
            threshold: any;
        },
    ) => {
        if (!buildEnv) {
            throw new Error('buildEnv argument is required');
        }

        if (!isValidBuildEnv(buildEnv)) {
            throw new Error(`Invalid buildEnv: ${buildEnv}`);
        }

        if (targetBrowser !== undefined && !isValidBrowserTarget(targetBrowser)) {
            throw new Error(`Invalid targetBrowser: ${targetBrowser}`);
        }

        const threshold = Number(options.threshold) || DEFAULT_SIZE_THRESHOLD_PERCENTAGE;

        switch (action) {
            case CheckerAction.Check:
                await checkBundleSizes({
                    buildEnv, targetBrowser, threshold,
                });
                break;
            case CheckerAction.Update:
                await updateBundleSize(buildEnv, targetBrowser);
                break;
            default:
                throw new Error(`Invalid action: ${action}`);
        }
    });

program.parse(process.argv);
