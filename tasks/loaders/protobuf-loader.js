const fs = require('fs');
const tmp = require('tmp-promise');
const { pbjs } = require('protobufjs/cli');
const protobuf = require('protobufjs');
const { getOptions } = require('loader-utils');
const validateOptions = require('schema-utils');

const schema = {
    type: 'object',
    properties: {
        json: {
            type: 'boolean',
        },
        paths: {
            type: 'array',
        },
        pbjsArgs: {
            type: 'array',
        },
    },
    additionalProperties: false,
};

module.exports = function protobufLoader(source) {
    const callback = this.async();
    const self = this;
    const defaultOptions = {
        json: false,
        paths: [],
        pbjsArgs: [],
    };
    const options = Object.assign({}, defaultOptions, getOptions(this));

    validateOptions(schema, options, 'protobuf-loader');

    let filename;

    tmp.file().then((o) => {
        filename = o.path;
        return new Promise(((resolve, reject) => {
            fs.write(o.fd, source, (err, bytesWritten, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bytesWritten, buffer);
                }
            });
        }));
    }).then(() => {
        const { paths } = options;

        const loadDependencies = new Promise(((resolve, reject) => {
            const root = new protobuf.Root();
            root.resolvePath = function (origin, target) {
                // Adapted from
                // https://github.com/dcodeIO/protobuf.js/blob/master/cli/pbjs.js
                const normOrigin = protobuf.util.path.normalize(origin);
                const normTarget = protobuf.util.path.normalize(target);

                let resolved = protobuf.util.path.resolve(normOrigin, normTarget, true);
                const idx = resolved.lastIndexOf('google/protobuf/');
                if (idx > -1) {
                    const altname = resolved.substring(idx);
                    if (altname in protobuf.common) {
                        resolved = altname;
                    }
                }

                if (fs.existsSync(resolved)) {
                    // Don't add a dependency on the temp file
                    if (resolved !== filename) {
                        self.addDependency(resolved);
                    }
                    return resolved;
                }

                for (let i = 0; i < paths.length; i += 1) {
                    const iresolved = protobuf.util.path.resolve(`${paths[i]}/`, target);
                    if (fs.existsSync(iresolved)) {
                        self.addDependency(iresolved);
                        return iresolved;
                    }
                }
            };
            protobuf.load(filename, root, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }));

        let args = options.pbjsArgs;
        paths.forEach((path) => {
            args = args.concat(['-p', path]);
        });
        args = args.concat([
            '-t',
            options.json ? 'json-module' : 'static-module',
        ]).concat([filename]);

        pbjs.main(args, (err, result) => {
            // Make sure we've added all dependencies before completing.
            loadDependencies.catch((depErr) => {
                callback(depErr);
            }).then(() => {
                callback(err, result);
            });
        });
    });
};
