---
description: Update globally installed SDD workflows to the latest version
---

# Update SDD Workflows

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Update the installed SDD workflows to the latest version from the SDD
repository. Detect whether workflows are installed locally (per-project) or
globally, then run the appropriate update.

## Prerequisites

Before starting, ensure:

1. **git** available in PATH
2. **Network access** to the SDD Bitbucket repository

## Steps

### Step 1: Detect Installation Type

1. **Check for local (per-project) installation**
    - Look for `.windsurf/workflows/sdd-spec.md` (or any `sdd-*.md` file) in
      the current workspace
    - If found, set `$INSTALL_MODE` to `local`

2. **Check for global installation**
    - Look for SDD workflow files in the global workflows directory:

    | OS | Path |
    | --- | --- |
    | macOS/Linux | `~/.codeium/windsurf/global_workflows/` |
    | Windows | `%USERPROFILE%\.codeium\windsurf\global_workflows\` |

    - If found (and no local installation), set `$INSTALL_MODE` to `global`

3. **Handle both or neither**
    - If **both** local and global are found, prefer `local` — the per-project
      installation is the one actively used by Windsurf (per-project overrides
      global). Inform the user:

    ```text
    Both local and global SDD installations detected. Updating local
    installation (.windsurf/workflows/) since it takes precedence.
    ```

    - If **neither** is found, default to `global` and inform the user:

    ```text
    No existing SDD installation found. Installing globally.
    ```

### Step 2: Read Current Metadata

1. **Extract the installed SDD version**
    - Based on `$INSTALL_MODE`, read any SDD workflow file from the
      corresponding directory
    - Extract the `version` value from the HTML comment metadata block
      (the `<!-- Workflow metadata ...` comment near the top of the file)
    - Store as `$OLD_VERSION`
    - If no version found, set `$OLD_VERSION` to "unknown"

2. **Extract the installed specs_dir**
    - From the same metadata block, extract the `specs_dir` value
    - Store as `$CURRENT_SPECS_DIR`
    - If no `specs_dir` found (older installation), set
      `$CURRENT_SPECS_DIR` to `specs/.current`

### Step 3: Run Installation

1. **Determine the operating system**
    - macOS/Linux: Use bash commands
    - Windows: Use PowerShell commands

2. **Execute the appropriate install command**

    **Bash (macOS/Linux)** — global:

    ```bash
    git clone ssh://git@bit.int.agrd.dev:7999/plat/sdd.git /tmp/sdd \
      && /tmp/sdd/scripts/install.sh --specs_dir=$CURRENT_SPECS_DIR \
      && rm -rf /tmp/sdd
    ```

    **Bash (macOS/Linux)** — local:

    ```bash
    git clone ssh://git@bit.int.agrd.dev:7999/plat/sdd.git /tmp/sdd \
      && /tmp/sdd/scripts/install.sh --mode=local --specs_dir=$CURRENT_SPECS_DIR \
      && rm -rf /tmp/sdd
    ```

    **PowerShell (Windows)** — global:

    ```powershell
    git clone ssh://git@bit.int.agrd.dev:7999/plat/sdd.git $env:TEMP\sdd
    & $env:TEMP\sdd\scripts\install.ps1 --specs_dir=$CURRENT_SPECS_DIR
    Remove-Item -Recurse -Force $env:TEMP\sdd
    ```

    **PowerShell (Windows)** — local:

    ```powershell
    git clone ssh://git@bit.int.agrd.dev:7999/plat/sdd.git $env:TEMP\sdd
    & $env:TEMP\sdd\scripts\install.ps1 --mode=local --specs_dir=$CURRENT_SPECS_DIR
    Remove-Item -Recurse -Force $env:TEMP\sdd
    ```

3. **Handle errors**
    - If `git clone` fails, report:

    ```text
    ERROR: Failed to clone SDD repository. Check network connectivity and
    repository access.
    ```

    - Do not modify existing installation on failure

### Step 4: Report Result

1. **Extract the new version**
    - Read any SDD workflow file from the updated directory
    - Extract the `version` value from the HTML comment metadata block
    - Store as `$NEW_VERSION`

2. **Compare versions and report**
    - If `$OLD_VERSION` equals `$NEW_VERSION`:

    ```text
    SDD is already up to date ($NEW_VERSION).
    ```

    - If versions differ:

    ```text
    SDD updated: $OLD_VERSION → $NEW_VERSION
    ```

    - If this was a fresh installation:

    ```text
    SDD $NEW_VERSION installed globally.
    ```

## Guidelines

- **Non-destructive**: If the update fails, the existing installation MUST
  remain intact
- **Local takes precedence**: When both installations exist, update the local
  one since Windsurf uses per-project workflows over global ones
- **Clean up**: Always remove the temporary clone directory, even on failure
- **Version reporting**: Always report the old and new versions so the user
  knows what changed
