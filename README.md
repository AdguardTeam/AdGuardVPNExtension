<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adtidy.org/public/Adguard/Common/Logos/vpn_logo_dark_ext.svg" width="300px" alt="AdGuard VPN extension" />
        <img src="https://user-images.githubusercontent.com/17472907/98385927-a14c1800-2060-11eb-98b2-126e8ed8efde.png" width="300px" alt="AdGuard VPN extension" />
    </picture>
</p>

<h3 align="center">Fast, flexible and reliable VPN extension for browsers</h3>

<p align="center">
    Your online safety and anonymity guaranteed by a trusted developer.
</p>

<p align="center">
    <a href="https://adguard-vpn.com/">Website</a> |
    <a href="https://reddit.com/r/Adguard">Reddit</a> |
    <a href="https://twitter.com/AdGuard">Twitter</a> |
    <a href="https://t.me/adguard_en">Telegram</a>
    <br /><br />
    <a href="https://github.com/AdguardTeam/AdGuardVPNExtension/releases">
        <img src="https://img.shields.io/github/release/AdguardTeam/AdGuardVPNExtension/all.svg" alt="Latest release">
    </a>
    <a href="https://agrd.io/vpn_chrome_extension">
        <img src="https://img.shields.io/chrome-web-store/v/hhdobjgopfphlmjbmnpglhfcgppchgje?labelColor=red" alt="Latest release">
    </a>
    <a href="https://agrd.io/vpn_firefox_extension">
        <img src="https://img.shields.io/amo/v/adguard-vpn?labelColor=orange" alt="Latest release">
    </a>
</p>

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/public/Adguard/screenshots/extension/adguardvpn_ext_dark_disconnected.png" width="250"/>
        <img src="https://cdn.adguard.com/public/Adguard/screenshots/extension/adguardvpn_disconnected.png" width="250">
    </picture>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://cdn.adguard.com/public/Adguard/screenshots/extension/adguardvpn_ext_dark_connected.png" width="250"/>
        <img src="https://cdn.adguard.com/public/Adguard/screenshots/extension/adguardvpn_connected.png" width="250">
    </picture>
</p>

AdGuard VPN serves to protect your online privacy, encrypt your connection,
hide your IP address and websites you visit from anyone (including your ISP).
Cutting-edge technologies and multiple customization options will help conceal your location
and ensure anonymous browsing on the web.

To get more information and to download AdGuard VPN
visit our website [https://adguard-vpn.com/](https://adguard-vpn.com/).

<a name="feedback"></a>

## Feedback options

We appreciate your feedback and always welcome both constructive criticism and new ideas.

You can use GitHub to report a bug or to submit a feature request.
To do so, go to [this page](https://github.com/AdguardTeam/AdguardVPNExtension/issues),
click the _New issue_ button and choose between creating a bug report or feature request.

- [Development](#development)
    - [Requirements](dev-requirements)
    - [Linting](#linting)
    - [Tests](#tests)
    - [Build](#build)
    - [Localization](#localization)
    - [Proto scheme update](#proto)
- [Acknowledgments](#acknowledgments)
- [Minimum supported browser versions](#minimum-supported-browser-versions)

## <a name="development"></a> Development

### <a name="dev-requirements"></a> Requirements

- [node.js LTS](https://nodejs.org/en/download/)
- NPM v8
- [yarn v1.22](https://yarnpkg.com/en/docs/install/)

#### Install local dependencies

```bash
yarn install
```

#### Manage environment variables

- Rename `.env.example` to `.env` and fill it with required config data
- Also, you can provide environment variables through command line like this:

```text
STAGE_ENV=test \
VPN_API_URL="vpn_api_url" \
AUTH_API_URL="auth_api_url" \
FORWARDER_DOMAIN="forwarder_domain" \
```

### <a name="linting"></a> Linting

```bash
yarn lint
```

### <a name="tests"></a> Tests

```bash
yarn test
```

### <a name="build"></a> Build

#### Dev version

```bash
yarn dev
```

#### Beta version

```bash
yarn beta
```

#### Release version

```bash
yarn release
```

**Builds will be located in the `build` directory**

By default, you will have builds for all browsers:

- Chrome (manifest version 2)
- Chrome (manifest version 3)
- Firefox (manifest version 2)
- Opera (manifest version 2)
- Edge (manifest version 2)

You can specify browser in arguments. See examples below:

```bash
yarn dev chrome
yarn beta chrome-mv3
yarn release opera
```

### Update resources

Before releasing new versions do not forget to update exclusions-services data, which will be used for migration if remote data was not received from the servers.

### Artifact builds

- `CREDENTIALS_PASSWORD=<password> artifacts:beta`
- `CREDENTIALS_PASSWORD=<password> artifacts:release`

Make sure you have added credentials

- certificate-beta.pem - chrome crx beta certificate
- certificate-release.pem - chrome crx release certificate
- mozilla_credentials.json - encrypted credentials,

to the directory `./private/AdguardVPN`

### <a name="localization"></a> Localization

- setup your project locales, directories in the file `tasks/locales.js`
- `yarn locales:upload` used to upload base `en` locale
- `yarn locales:download` run to download and save all locales
- `yarn locales:validate` used to validate locales
- `yarn locales:validate --min` used to validate only major locales

### <a name="proto"></a> Proto scheme update

After every update of proto scheme in the file `src/background/connectivity/connectivity.proto`,
you have to run `yarn compile-proto`.
This command will update module `src/background/connectivity/protobufCompiled.js` used to build messages
with appropriate scheme for websocket messaging.

## <a name="acknowledgments"></a> Acknowledgments

This software wouldn't have been possible without:

- [React](https://github.com/facebook/react)
- [MobX](https://github.com/mobxjs/mobx)
- [Babel](https://github.com/babel/babel)
- [Jest](https://github.com/facebook/jest)
- and many more npm packages.

For a full list of all `npm` packages in use, please take a look at [package.json](package.json) file.

## <a id='minimum-supported-browser-versions'></a> Minimum supported browser versions

| Browser                     | Version |
|-----------------------------|:-------:|
| Chromium Based Browsers MV3 | 109     |
| Chromium Based Browsers MV2 | 66      |
| Firefox                     | 91.1    |
