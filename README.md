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

- [Feedback options](#feedback)
- [Development](#development)
    - [Requirements](dev-requirements)
    - [Linting](#linting)
    - [Tests](#tests)
    - [Build](#build)
        - [Special building instructions for Firefox reviewers](#build-firefox-review)
    - [Localization](#localization)
    - [Proto scheme update](#proto)
- [Acknowledgments](#acknowledgments)
- [Minimum supported browser versions](#minimum-supported-browser-versions)

## <a name="feedback"></a> Feedback options

We appreciate your feedback and always welcome both constructive criticism and new ideas.

You can use GitHub to report a bug or to submit a feature request.
To do so, go to [this page](https://github.com/AdguardTeam/AdguardVPNExtension/issues),
click the _New issue_ button and choose between creating a bug report or feature request.

## <a name="development"></a> Development

### <a name="dev-requirements"></a> Requirements

- [Node.js][nodejs]: v22 (you can install multiple versions using [nvm][nvm])
- [pnpm][pnpm]: v10
- [Git][git]

> [!NOTE]
> For development, our team uses macOS and Linux. It may be possible that some commands not work on Windows,
> so if you are using Windows, we recommend using WSL or a virtual machine.

[nodejs]: https://nodejs.org/en/download
[git]: https://git-scm.com/
[pnpm]: https://pnpm.io/installation
[nvm]: https://github.com/nvm-sh/nvm

#### Install local dependencies

```bash
pnpm install
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
pnpm lint
```

### <a name="tests"></a> Tests

```bash
pnpm test
```

### <a name="build"></a> Build

#### Dev version

```bash
pnpm dev
```

#### Beta version

```bash
pnpm beta
```

#### Release version

```bash
pnpm release
```

**Builds will be located in the `build` directory**

By default, you will have builds for all browsers:

- Chrome — manifest versions **3**
- Firefox — manifest version **3**
- Edge — manifest version **3**
- Opera — manifest version **3**

You can specify browser in arguments. See examples below:

```bash
pnpm dev chrome
pnpm release opera
```

### Update resources

Before releasing new versions do not forget to update exclusions-services data, which will be used for migration if remote data was not received from the servers.

### Artifact builds

#### `crx` builds

Before building `crx` make sure you have [built](#build)
the extension and also make sure you have added credentials:

- `certificate-beta.pem` - chrome crx beta certificate
- `certificate-release.pem` - chrome crx release certificate,

to the directory `./private/AdguardVPN`.

For testing purposes for `crx:dev` command credentials taken from `./tests/certificate-test.pem` file.

WARNING: DO NOT USE TEST CREDENTIALS FOR PRODUCTION BUILDS, BECAUSE THEY ARE AVAILABLE IN PUBLIC.

If you want to generate your own credentials you can go to
[How to generate credentials for `crx` builds](#how-to-generate-credentials-for-crx-builds) for more details

To build `crx`, run:

- `pnpm crx:dev`
- `pnpm crx:beta`
- `pnpm crx:release`

**`crx` will be located in the `build/channel` directory**

Where `channel` is one of the following:
- `dev` (`build/dev/chrome.crx`)
- `beta` (`build/beta/chrome.crx`)
- `release` (`build/release/chrome.crx`)

By default, you will have builds for:

- Chrome — manifest versions **3** (`chrome.crx`)

##### How to generate credentials for `crx` builds

You can use [Crx CLI `keygen`](https://github.com/thom4parisot/crx#crx-keygen-directory)
to generate credentials for `crx` builds, see the example below:

```bash
# Command will generate `key.pem` credential in the `./private/AdguardVPN` directory
pnpm crx keygen ./private/AdguardVPN
```

#### <a name="build-firefox-review"></a> Special building instructions for Firefox reviewers

If you need to build the **BETA** version:

1. To ensure that the extension is built in the same way, use the docker image:

    ```shell
    docker run --rm -it \
        -v $(pwd):/workspace \
        -w /workspace \
        --env-file .env \
        adguard/node-ssh:22.14--0 \
        /bin/sh -c "
            pnpm install && \
            STAGE_ENV=prod \
            pnpm beta firefox"
    ```

1. Compare the generated `build/beta/firefox.zip` file with the uploaded one.

If you need to build the **RELEASE** version:

1. To ensure that the extension is built in the same way, use the docker image:

    ```shell
    docker run --rm -it \
        -v $(pwd):/workspace \
        -w /workspace \
        --env-file .env \
        adguard/node-ssh:22.14--0 \
        /bin/sh -c "
            pnpm install && \
            STAGE_ENV=prod \
            pnpm release firefox"
    ```

1. Compare the generated `build/release/firefox.zip` file with the uploaded one.

### <a name="localization"></a> Localization

- setup your project locales, directories in the file `tasks/locales.js`
- `pnpm locales:upload` used to upload base `en` locale
- `pnpm locales:download` run to download and save all locales
- `pnpm locales:validate` used to validate locales
- `pnpm locales:validate --min` used to validate only major locales

### <a name="proto"></a> Proto scheme update

After every update of proto scheme in the file `src/background/connectivity/connectivity.proto`,
you have to run `pnpm compile-proto`.
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

## <a name='minimum-supported-browser-versions'></a> Minimum supported browser versions

<!-- NOTE: see MIN_SUPPORTED_VERSION in ./tasks/consts.ts -->

| Browser                     | Version |
|-----------------------------|---------|
| Chromium Based Browsers     | 109     |
| Firefox                     | 115     |
| Opera                       | 95      |
