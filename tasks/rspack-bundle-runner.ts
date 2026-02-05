/* eslint-disable no-console */
import { rspack, type Configuration, type Stats } from '@rspack/core';

export const bundleRunner = (
    rspackConfig: Configuration,
    watch = false,
): Promise<void> => {
    const compiler = rspack(rspackConfig);

    const run = watch
        ? (cb: (err: any, stats: any) => void) => compiler.watch({}, cb)
        : (cb: (err: any, stats: any) => void) => compiler.run(cb);

    return new Promise((resolve, reject) => {
        run((err: any, stats: Stats) => {
            if (err) {
                console.error(err.stack || err);
                if (err.details) {
                    console.error(err.details);
                }
                reject();
                return;
            }
            if (stats.hasErrors()) {
                console.log(stats.toString({
                    colors: true,
                    all: false,
                    errors: true,
                    moduleTrace: true,
                }));
                reject();
                return;
            }

            console.log(stats.toString({
                chunks: false, // Makes the build much quieter
                colors: true, // Shows colors in the console
            }));
            resolve();
        });
    });
};
