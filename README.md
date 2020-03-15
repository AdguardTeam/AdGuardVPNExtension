# AdGuard VPN extension

## Build
* `yarn install`
* `yarn dev` / `yarn beta` / `yarn release`

Builds will be located in the `build` directory

## Lint
* `yarn lint`

## Tests
* `yarn test`

## Localisation
* `setup your project locales, directories in the file tasks/locales.js`
* `yarn locales:upload` used to upload base `en` locale
* `yarn locales:download` run to download and save all locales

### Proto scheme update
After every update of proto scheme in the file `src/background/connectivity/connectivity.proto`,
you have to run `yarn compile-proto`.
This command will update module `src/background/connectivity/protobufCompiled.js` used to build messages
with appropriate scheme for websocket messaging.
