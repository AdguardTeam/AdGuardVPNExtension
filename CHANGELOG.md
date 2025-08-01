# AdGuard VPN Extension Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- TODO: Add release date -->
## [2.6.1]

### Added

- Clear button to authentication inputs [#210].
- Title to saved locations tab [#211].
- Hover effect to saved location tabs [#214].
- VPN Usage statistics [#207].

### Changed

- The minimum supported Opera version is now 109 due to MV3 migration.
- The minimum supported Firefox version is now 115 due to `storage.session` adoption.

### Fixed

- Email field is not mandatory in the report bug form [#204].
- Actions button color [#209].
- Hover effect of exclusion checkbox [#215].

[2.6.1]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.5.2...v2.6.1
[#204]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/204
[#207]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/207
[#209]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/209
[#210]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/210
[#211]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/211
[#214]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/214
[#215]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/215

## [2.5.2] - 2025-04-14

### Added

- Limit on the number of characters a user can enter when adding a custom DNS server [#169].
- Saved Locations [#48].

### Changed

- Improved validation of domain name when adding an exclusions [#191].
- `"subdomain"` placeholder of input to `"example"` in add subdomain modal [#199].
- Updated design and logic of notifications [#198].

### Fixed

- Inconsistent colors of UI elements [#171].
- Disable resend email button for 60 seconds after clicking it [#192].
- "X" icon in the locations is hard to see with long letters [#197].
- Flashing of skeleton loader [#168].
- 'Disable VPN on this website' hint is not displaying in the extension popup [#203].
- Corners of Actions is not rounded [#200].
- Incorrect height rendering in Edge for Android.

[2.5.2]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.4.6...v2.5.2
[#48]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/48
[#168]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/168
[#169]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/169
[#171]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/171
[#191]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/191
[#192]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/192
[#197]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/197
[#198]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/198
[#199]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/199
[#200]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/200
[#203]: https://github.com/AdguardTeam/AdGuardVPNExtension/issues/203

## [2.4.6] - 2025-03-10

### Changed

- The minimum supported Edge version is now 109 due to the move to MV3.

[2.4.6]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.4.3...v2.4.6

## [2.4.3] - 2025-02-27

### Added

- Anonymized telemetry data collection to capture usage metrics.

### Changed

- UI Design of options page.
- Logic of how rate us dialog is shown.

### Fixed

- Error with `chrome.offscreen.createDocument` on Chrome 109 when connecting to proxy for MV3 [#190].

[2.4.3]: https://github.com/AdguardTeam/AdGuardVPNExtension/compare/v2.3.2...v2.4.3
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
