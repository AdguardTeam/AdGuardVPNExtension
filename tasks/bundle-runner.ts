import webpack from 'webpack';

const {
    log: logInfo,
    error: logError,
} = console;

export const bundleRunner = (
    webpackConfig: webpack.Configuration,
    watch = false,
): Promise<void> => {
    const compiler = webpack(webpackConfig);

    const run = watch
        ? (cb: (err: any, stats: any) => void) => compiler.watch({}, cb)
        : (cb: (err: any, stats: any) => void) => compiler.run(cb);

    return new Promise((resolve, reject) => {
        run((err: any, stats: webpack.Stats) => {
            if (err) {
                logError(err.stack || err);
                if (err.details) {
                    logError(err.details);
                }
                reject();
                return;
            }
            if (stats.hasErrors()) {
                logInfo(stats.toString({
                    colors: true,
                    all: false,
                    errors: true,
                    moduleTrace: true,
                }));
                reject();
                return;
            }

            logInfo(stats.toString({
                chunks: false, // Makes the build much quieter
                colors: true, // Shows colors in the console
            }));
            resolve();
        });
    });
};
