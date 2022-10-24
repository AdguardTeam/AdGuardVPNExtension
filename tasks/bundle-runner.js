import webpack from 'webpack';

const {
    log: logInfo,
    error: logError,
} = console;

export const bundleRunner = (webpackConfig, watch = false) => {
    const compiler = webpack(webpackConfig);

    const run = watch
        ? (cb) => compiler.watch({}, cb)
        : (cb) => compiler.run(cb);

    return new Promise((resolve, reject) => {
        run((err, stats) => {
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
                    logging: 'error',
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
