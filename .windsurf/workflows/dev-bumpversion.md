---
description: Bump version in project metadata files and update CHANGELOG.md
---

# Bump Version

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Update the version number in project metadata files and update `CHANGELOG.md`
to reflect the new release. Auto-detect which metadata files are present and
update all of them.

## Input

`$ARGUMENTS` is the text the user provides after the slash command. It may
contain a version number (optional). The version must follow semantic versioning
format (e.g., `1.2.0`).

If no version is provided, automatically deduce the next version from the
unreleased changelog entries using semantic versioning rules.

## Prerequisites

Before starting, verify:

1. `CHANGELOG.md` exists and has an `## [Unreleased]` section
2. The `## [Unreleased]` section has content to release

If the Unreleased section is empty:

**ERROR: The `## [Unreleased]` section is empty. Add changelog entries before
bumping version.**

## Steps

### Phase 1: Determine Version

1. **Check if version was provided**
    - If `$ARGUMENTS` contains a version number, use it as `$NEW_VERSION`
    - Validate it matches semantic versioning pattern: `X.Y.Z` where X, Y, Z
      are non-negative integers
    - If invalid, report error with correct format
    - Skip to step 3 (version validation)

2. **Deduce version from changelog** (only if no version provided)
    - Read `CHANGELOG.md` to find the latest released version (e.g., `1.0.0`)
    - Parse the `## [Unreleased]` section to identify which subsections exist:
        - **Breaking changes**: Check if any entry contains "BREAKING" or if
          there are backwards-incompatible changes described
        - **Added**: New features or capabilities
        - **Changed**: Changes to existing functionality
        - **Removed**: Removed features or capabilities
        - **Fixed**: Bug fixes only
    - Apply semantic versioning rules to determine bump type:
        - **Major bump** (X+1.0.0): If "BREAKING" mentioned, or `### Removed`
          exists, or significant backwards-incompatible changes in `### Changed`
        - **Minor bump** (X.Y+1.0): If `### Added` exists (new features)
        - **Patch bump** (X.Y.Z+1): If only `### Fixed` and/or `### Changed`
          exist (bug fixes and minor changes only)
    - Calculate `$NEW_VERSION` by incrementing the appropriate component and
      resetting lower components to 0
    - Report the deduced version and reasoning to the user before proceeding

3. **Validate new version**
    - Read `CHANGELOG.md` to find the latest released version
    - Verify `$NEW_VERSION` is greater than the current version
    - If not, report error

### Phase 2: Update Project Metadata Files

1. **Detect metadata files**

    Scan the project root for the following files (in this order). Update every
    file that is found:

    | File | Version field | Update instructions |
    | ---- | ------------- | ------------------- |
    | `package.json` | `"version": "X.Y.Z"` | Update the `"version"` field value |
    | `pom.xml` | `<version>X.Y.Z</version>` | Update only the top-level `<project><version>` element, not dependency versions |
    | `build.gradle` | `version = 'X.Y.Z'` or `version "X.Y.Z"` | Update the top-level `version` assignment |
    | `build.gradle.kts` | `version = "X.Y.Z"` | Update the top-level `version` assignment |
    | `Cargo.toml` | `version = "X.Y.Z"` | Update only `version` under `[package]`, not dependency versions |
    | `pyproject.toml` | `version = "X.Y.Z"` | Update `version` under `[project]` or `[tool.poetry]` |
    | `pubspec.yaml` | `version: X.Y.Z` | Update the top-level `version` field (preserve build metadata after `+` if present) |
    | `*.csproj` | `<Version>X.Y.Z</Version>` | Update the `<Version>` element in `<PropertyGroup>` |
    | `*.gemspec` | `spec.version = "X.Y.Z"` | Update the version assignment |
    | `lib/*/version.rb` | `VERSION = "X.Y.Z"` | Update the `VERSION` constant |
    | `composer.json` | `"version": "X.Y.Z"` | Update the `"version"` field value |
    | `mix.exs` | `version: "X.Y.Z"` | Update the `version` field in the project definition |

2. **Update each detected file**
    - Read the file
    - Locate the version field using the patterns above
    - Replace the version value with `$NEW_VERSION`
    - Write the updated file
    - Report which files were updated

3. **Handle no metadata files found**
    - If no metadata files are detected, inform the user:

    ```text
    No version metadata files found. The version will come from the git tag
    only. Continuing with CHANGELOG.md update.
    ```

### Phase 3: Update CHANGELOG.md

1. **Read the current CHANGELOG.md**
    - Parse the file structure
    - Identify the `## [Unreleased]` section and its content
    - Identify the version links at the bottom of the file

2. **Create new version section**
    - Get today's date in `YYYY-MM-DD` format
    - Create new section header: `## [v$NEW_VERSION] - YYYY-MM-DD`
    - Move all content from `## [Unreleased]` to the new version section
    - Leave `## [Unreleased]` empty (just the header)

3. **Update version links**
    - Find the existing version link references at the bottom of the file
    - Add a new version link formatted consistently with existing links
    - Update the `[unreleased]` link to compare from the new version tag

### Phase 4: Verification

1. **Manual verification checklist**

    - [ ] All detected metadata files have the new version
    - [ ] `CHANGELOG.md` has new version section with today's date
    - [ ] `## [Unreleased]` section is empty (header only)
    - [ ] Version link added at bottom of `CHANGELOG.md`
    - [ ] `[unreleased]` link updated to compare from new tag

2. **Run project lint** (if available)
    - Run the project's lint commands as documented in `AGENTS.md`
      (Build And Test Commands section)
    - Fix any issues before proceeding

### Phase 5: Output

1. **Report completion status**
    - List all files modified
    - Show the new version section in CHANGELOG.md
    - Show the new version links at the bottom of CHANGELOG.md

2. **Print next steps for the user**

    ```text
    Version bump complete. Run the following command:

    git add -A && git commit -m "Bump version to v$NEW_VERSION" && git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION" && git push origin "$(git branch --show-current)" --tags
    ```

## Guidelines

- **Atomic changes**: All version updates should happen together
- **Validate first**: Check all prerequisites before making changes
- **Preserve content**: Never lose changelog entries during the move
- **Consistent format**: Use the same version format everywhere `(vX.Y.Z)`
- **Date accuracy**: Use the actual current date for the release
- **Semantic versioning**: When deducing version automatically, follow strict
  semantic versioning rules based on changelog sections
- **Transparency**: When auto-deducing version, clearly explain the reasoning
  to the user before proceeding
- **Safe updates**: Only update the project-level version field in each
  metadata file — never modify dependency version constraints
