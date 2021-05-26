<p align="center">
  <img src="https://user-images.githubusercontent.com/17472907/98385927-a14c1800-2060-11eb-98b2-126e8ed8efde.png" width="300px" alt="AdGuard VPN extension" />
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
</p>


<p align="center">
<image src="https://user-images.githubusercontent.com/17472907/98386395-2df6d600-2061-11eb-9cf1-1a77cc35d9d8.png" width="250"> <image src="https://user-images.githubusercontent.com/17472907/98386416-318a5d00-2061-11eb-860e-d210a789f4cb.png" width="250">
</p>

AdGuard VPN serves to protect your online privacy, encrypt your connection, hide your IP address and websites you visit from anyone (including your Internet provider) and to ensure anonymous browsing on the web. Cutting edge technologies and multiple customization options will help conceal your location and unblock geographically restricted websites or other content.

To get more information and to download AdGuard VPN visit our website [https://adguard-vpn.com/](https://adguard-vpn.com/).

<a id="feedback"></a>

## Feedback options

We appreciate your feedback and always welcome both constructive critisism and new ideas.

You can use GitHub to report a bug or to submit a feature request. To do so, go to [this page](https://github.com/AdguardTeam/AdguardVPNExtension/issues), click the _New issue_ button and choose between creating a bug report or feature request.

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
* Also, you can provide environment variables through command line like this:
```
STAGE_ENV=test \
VPN_API_URL="vpn_api_url" \
AUTH_API_URL="auth_api_url" \
WEBSITE_DOMAIN="website_domain" \
yarn dev
```

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


