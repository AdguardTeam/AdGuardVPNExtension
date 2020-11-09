# AdGuard VPN extension

- [Development](#development)
    - [Build](#build)
    - [Linting](#linting)
    - [Tests](#tests)
    - [Localization](#localization)
    - [Proto scheme update](#proto)
- [Acknowledgments](#acknowledgments)
- [Minimum supported browser versions](#minimum-supported-browser-versions)

<a id="development"></a>
## Development

<a id="build"></a>
### Build
* `yarn install`
* Rename `.env.example` to `.env` and fill it with required config data
* `yarn dev` / `yarn beta` / `yarn release`

Builds will be located in the `build` directory

### Artifact builds
* `CREDENTIALS_PASSWORD=<password> artifacts:beta`
* `CREDENTIALS_PASSWORD=<password> artifacts:release`

Make sure you have added credentials

* certificate-beta.pem - chrome crx beta certificate
* certificate-release.pem - chrome crx release certificate
* mozilla_credentials.json - encrypted credentials,

to the directory `./private/AdguardVPN`

<a id="linting"></a>
### Linting
* `yarn lint`

<a id="tests"></a>
### Tests
* `yarn test`

<a id="localization"></a>
### Localization
* setup your project locales, directories in the file `tasks/locales.js`
* `yarn locales:upload` used to upload base `en` locale
* `yarn locales:download` run to download and save all locales
* `yarn locales:validate` used to validate locales

<a id="proto"></a>
### Proto scheme update
After every update of proto scheme in the file `src/background/connectivity/connectivity.proto`,
you have to run `yarn compile-proto`.
This command will update module `src/background/connectivity/protobufCompiled.js` used to build messages
with appropriate scheme for websocket messaging.

<a id="acknowledgments"></a>
## Acknowledgments
This software wouldn't have been possible without:

- [React](https://github.com/facebook/react)
- [MobX](https://github.com/mobxjs/mobx)
- [Babel](https://github.com/babel/babel)
- [Jest](https://github.com/facebook/jest)
- and many more npm packages.

For a full list of all `npm` packages in use, please take a look at [package.json](package.json) file.

<a id='minimum-supported-browser-versions'></a>
## Minimum supported browser versions
| Browser                 	| Version 	|
|-------------------------	|:-------:	|
| Chromium Based Browsers 	|    66   	|
| Firefox                 	|    60   	|


