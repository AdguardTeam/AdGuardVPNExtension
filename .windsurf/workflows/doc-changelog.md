---
description: Actualize CHANGELOG.md by initializing, updating from uncommitted changes, and compressing entries
---

# Actualize CHANGELOG

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Maintain `CHANGELOG.md` by initializing it when missing, adding entries for
uncommitted changes, and compressing the Unreleased section.

## Prerequisites

Before starting, verify:

- The project is a git repository (`git rev-parse --git-dir` succeeds)
- `AGENTS.md` exists (for contribution rules and lint commands)

If `AGENTS.md` is missing, ask the user whether to proceed without it.

## Steps

### Phase 1: Initialize

1. **Check if `CHANGELOG.md` exists**
    - If it exists, read and review its contents
    - If it does not exist, create it with the following structure:

    ```markdown
    # Changelog

    All notable changes to this project will be documented in this file.

    The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
    and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

    ## [Unreleased]
    ```

2. **Detect repository URL** (only when creating a new file)
    - Run `git remote get-url origin` to detect the repository URL
    - If detected, add a link reference at the bottom of the file:
      `[unreleased]: <repo-url>/compare/<latest-tag>...HEAD`
    - If no remote is found, skip the link reference

### Phase 2: Update from Uncommitted Changes

1. **Check for uncommitted changes**
    - Run `git diff` and `git diff --cached` to inspect unstaged and staged
      changes
    - If there are no uncommitted changes, skip to Phase 3

2. **Analyze the diffs**
    - Review the diffs to understand what changed
    - Classify each change into the appropriate category:
        - New files, new exports, new features → `### Added`
        - Modified behavior, refactored logic, updated dependencies → `### Changed`
        - Bug fixes (identified by context, naming, or intent) → `### Fixed`
        - Deleted files, removed features or exports → `### Removed`

3. **Read the existing Unreleased section**
    - Identify all current entries under `## [Unreleased]`
    - Note which subsections already exist and their contents

4. **Generate changelog entries**
    For each identified change:
    - Write a concise, user-facing description (not a file-level diff summary)
    - Check if an equivalent entry already exists (semantic match, not exact
      string match)
    - Skip entries that are already described in the Unreleased section

5. **Add new entries to the Unreleased section**
    - Add entries to the appropriate subsections
    - If a subsection does not exist, create it
    - Respect the standard order: Added → Changed → Fixed → Removed
    - Do not create duplicate subsections

### Phase 3: Compress

1. **Validate each entry against current codebase**
    For each changelog entry in the Unreleased section:
    - Search the codebase to verify the feature/file/component still exists
    - Check if referenced files, functions, classes, or environment variables
      are present
    - Mark entries as **valid** (still relevant) or **obsolete** (no longer
      applies)

    Examples of obsolete entries:
    - References to files that were deleted or renamed
    - Features that were reverted or replaced
    - Environment variables that no longer exist
    - Intermediate implementation steps that were superseded

2. **Remove obsolete entries**
    - Delete any entries that reference code/features no longer in the codebase
    - If an entire subsection becomes empty after removal, delete the subsection
      header too

3. **Merge duplicate subsections**
    - Check for duplicate `### Added`, `### Changed`, `### Fixed`, or
      `### Removed` headers
    - Under `## [Unreleased]` there must be at most ONE of each subsection
    - If duplicates exist, merge all entries under a single header
    - Preserve the standard order: Added → Changed → Fixed → Removed

4. **Identify entries that can be consolidated**
    Look for:
    - Multiple entries describing the same feature added incrementally
    - Entries that describe sub-parts of a larger feature
    - Sequential additions to the same component/service
    - Related environment variables that can be grouped

5. **Consolidate related entries**
    Merge related entries into single, comprehensive entries:
    - Combine incremental feature additions into one entry describing the
      complete feature
    - Group related environment variables together
    - Preserve all important details while eliminating redundancy
    - Use nested bullet points for sub-features when appropriate

6. **Verify the compressed changelog**
    - Ensure no important information was lost
    - Check that the compressed entries are clear and complete
    - Verify markdown formatting is correct

### Phase 4: Validation

1. **Review the final `CHANGELOG.md`**
    Verify:
    - [ ] Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
      format
    - [ ] Has at most one of each subsection under `## [Unreleased]`
    - [ ] No duplicate or obsolete entries remain
    - [ ] New entries accurately describe the uncommitted changes
    - [ ] Existing released sections are untouched

2. **Run lint**
    - Run the project's lint/format commands as documented in `AGENTS.md`
      (Build And Test Commands section) to verify formatting

## Guidelines

- **User-facing language**: Write entries as a user or maintainer would read
  them, not as file-level diff summaries
- **Preserve meaning**: Never remove information about features that still exist
- **Be concise**: Aim to reduce entry count by 30-50% through consolidation
  during compression
- **Maintain structure**: Keep the standard subsections (Added, Changed, Fixed,
  Removed)
- **No duplicates**: Check existing entries before adding new ones; use semantic
  matching, not exact string comparison
- **Skip gracefully**: If there are no uncommitted changes, still run
  compression on the existing Unreleased section
- **Don't touch releases**: Never modify content under versioned release headers
- **Group logically**: Combine entries by feature/component, not arbitrarily
