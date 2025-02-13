# AdGuard VPN Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- UI Design of options page.

### Fixed

- Error with `chrome.offscreen.createDocument` on Chrome 109 when connecting to proxy for MV3 [#190].

[Unreleased]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.3.2...HEAD
[#190]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/190

## [2.3.2] - 2024-12-10

### Added

- Ability to add a custom DNS server by pressing the Enter key [#180].
- UI support for the options page on mobile screens.

### Fixed

- Hover-effect is missing on 'Cancel' button on 'Can’t connect to server' screen [#189].

[2.3.2]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.32...v2.3.2
[#180]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/180
[#189]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/189

## [2.2.31] - 2024-10-23

### Changed

- Updated [@adguard/logger] to `v1.1.1`.

[2.2.31]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.27...v2.2.31

## [2.2.27] - 2024-08-27

### Added

- Macedonian language support [#184].

[2.2.27]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.24...v2.2.27
[#184]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/184

## [2.2.24] - 2024-08-06

### Changed

- Updated [@adguard/logger] to `v1.0.1`.

### Fixed

- Bug with logging `null` values [#176].

[2.2.24]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.20...v2.2.24
[#176]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/176

## [2.2.17] - 2024-05-02

### Added

- [@adguard/logger] `v1.0.0` library for logging.

### Changed

- Backend API domain is used for forwarder urls.

[2.2.17]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.14...v2.2.17

## [2.2.14] - 2024-03-15

### Fixed

- Scrollbars appear when selecting locations [#166].

[2.2.14]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.2.9...v2.2.14
[#166]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/166

## [2.2.9] - 2024-02-14

### Added

- Add location pings reload button to the popup [#156].

### Fixed

- Popup menu rating start hiding if clicked [#150].

[2.2.9]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.1.7...v2.2.9
[#156]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/156
[#150]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/150

## [2.1.7] - 2023-12-21

### Added

- Separate popup warning for no location with ability to re-fetch locations.

[2.1.7]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.1.5...v2.1.7

## [2.1.5] - 2023-11-21

### Removed

- WHOAMI requests.

[2.1.5]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.1.1...v2.1.5

## [2.1.1] - 2023-11-15

### Added

- Firefox MV3 support.

### Fixed

- Logs sending during bug report [#149].

[2.1.1]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.0.65...v2.1.1
[#149]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/149

[@adguard/logger]: https://github.com/AdguardTeam/tsurlfilter/blob/master/packages/logger/CHANGELOG.md
