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
- [Acknowledgments](#acknowledgments)
- [Minimum supported browser versions](#minimum-supported-browser-versions)
- [Documentation](#documentation)
<!-- TOC:AMO_REVIEW -->

## <a name="feedback"></a> Feedback options

We appreciate your feedback and always welcome both constructive criticism and new ideas.

You can use GitHub to report a bug or to submit a feature request.
To do so, go to [this page](https://github.com/AdguardTeam/AdguardVPNExtension/issues),
click the _New issue_ button and choose between creating a bug report or feature request.

## <a name="development"></a> Development

For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Quick Start

```bash
# Install dependencies
pnpm install

# Build development version
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint
```

## <a name="acknowledgments"></a> Acknowledgments

This software wouldn't have been possible without:

- [React](https://github.com/facebook/react)
- [MobX](https://github.com/mobxjs/mobx)
- [Babel](https://github.com/babel/babel)
- [Vitest](https://github.com/vitest-dev/vitest)
- and many more npm packages.

For a full list of all `npm` packages in use, please take a look at [package.json](package.json) file.

## <a name='minimum-supported-browser-versions'></a> Minimum supported browser versions

<!-- NOTE: see MIN_SUPPORTED_VERSION in ./tasks/consts.ts -->

| Browser                 | Version |
|-------------------------|---------|
| Chromium Based Browsers | 109     |
| Firefox                 | 115     |
| Firefox Android         | 132     |
| Opera                   | 95      |

## Documentation

- [Development Guide](DEVELOPMENT.md) — detailed setup and workflow instructions
- [Contributor Guidelines](AGENTS.md) — code style and contribution rules
- [Changelog](CHANGELOG.md) — version history
