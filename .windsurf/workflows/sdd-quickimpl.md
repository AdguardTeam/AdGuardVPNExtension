---
description: Implement a fix or small change from a quick specification
---

# Quick Implementation

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Implement a fix or small change according to the analysis in the quick
specification (`{specs_dir}/quick.md`).

## Input

`$ARGUMENTS` is the text the user provides after the slash command. It may
contain instructions to control implementation. Examples:

- Scope: "Skip tests for now"
- Corrections: "Ignore file X, also change Y"
- Context: Additional information not captured in the quick spec

If no arguments are provided, implement everything in the quick spec.

## Prerequisites

Check for the existence of the required file:

- `{specs_dir}/quick.md` - The quick specification

If the file is missing:

**ERROR: Quick spec not found. Run `/sdd-quickspec` first to analyze the problem.**

## Steps

### Phase 1: Load Context

1. **Read the quick spec**
    - Read `{specs_dir}/quick.md`
    - Extract:
        - Problem statement
        - Root cause analysis
        - Affected files list
        - Patterns to follow
        - Tasks and their verification criteria
        - Overall verification steps

2. **Read project guidelines**
    - Read `AGENTS.md` if it exists (coding standards and patterns)
    - Read `DEVELOPMENT.md` if it exists (development setup)

3. **Verify affected files exist**
    - Check that all files listed in the quick spec exist
    - If files are missing, report and stop

### Phase 2: Implement

For each task in the quick spec:

1. **Apply the fix or change**
    - Follow the task description from the quick spec
    - Follow the patterns identified in the quick spec
    - Keep changes minimal and focused

2. **Verify the task**
    - Execute the task-level verification criteria
    - If verification fails, fix before proceeding

3. **Report task status**
    - **DONE**: Task completed and verified
    - **BLOCKED**: Cannot proceed (explain why and stop)
    - **NEEDS INPUT**: Requires user decision (explain and stop)

4. **Check scope**
    - If the change is bigger than expected or affects unrelated components,
      stop and recommend switching to the full SDD flow
      (`/sdd-spec` → `/sdd-plan` → `/sdd-implement`)

After completing all tasks:

1. **Update tests** (if applicable)
    - Add or update tests to cover the change
    - Ensure tests verify the fix works

2. **Update documentation** (if applicable)
    - Update any affected documentation
    - Add comments for non-obvious changes

### Phase 3: Verify

1. **Run verification steps**
    - Execute each verification item from the quick spec
    - Run relevant tests
    - Perform any manual checks listed

2. **Run project checks**
    - Execute linter and formatter
    - Run the test suite
    - Check for build errors

3. **Confirm fix**
    - Verify the original problem is resolved
    - Check for regressions

### Phase 4: Cleanup

1. **Update quick spec status**
    - Change status from "Draft" to "Implemented" in `{specs_dir}/quick.md`
    - Add `**Implemented by**: [MODEL_NAME MODEL_VERSION THINKING_EFFORT]`
      to the quick spec header metadata
    - Add implementation notes if helpful

2. **Final lint check**
    - Run linters and tests or equivalent
    - Fix any issues

## Output

After implementation:

1. **Summary**
    - What was fixed or changed
    - Files modified
    - Tests added or updated

2. **Verification results**
    - Which checks passed
    - Any issues encountered

3. **Next steps** (if any)
    - Suggest running `/sdd-validate` to verify completeness
    - Additional manual verification needed
    - Related issues to address

## Guidelines

- **Follow the spec**: Implement what the quick spec describes
- **Minimal changes**: Don't expand scope beyond the spec
- **Verify before completing**: Ensure the fix actually works
- **Update tests**: Cover the change with tests when possible
- **Report blockers**: If stuck, explain clearly and stop
- **Escalate when needed**: If scope grows, recommend full SDD flow
- **Stay focused**: If new issues are discovered, create separate tasks
