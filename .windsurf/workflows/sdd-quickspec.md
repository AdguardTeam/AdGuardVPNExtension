---
description: Create a lightweight analysis for bug fixes and small tasks
---

# Quick Specification

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Produce a lightweight analysis document for bug fixes and small tasks that
don't require full feature specifications. Combine problem analysis, codebase
research, and solution design into a single output file.

## Input

`$ARGUMENTS` is the text the user provides after the slash command. It must
contain a problem description. Examples:

- Bug fix: "fix the null pointer exception in UserService.getUser()"
- Refactoring: "rename processData function to transformUserInput"
- Configuration: "add Redis connection timeout configuration"

If no description is provided, stop and report:
**ERROR: No problem description provided.**

## Steps

### Phase 1: Problem Analysis

1. **Extract the problem statement**
    - Identify what needs to be fixed or changed
    - Determine the type of task (bug fix, refactoring, configuration, etc.)
    - Note any specific files, functions, or components mentioned

2. **Read project context**
    - Read `README.md` to understand the product
    - Read `AGENTS.md` if it exists (coding standards and patterns)
    - Read `DEVELOPMENT.md` if it exists (development setup)
    - Understand the project structure and conventions

### Phase 2: Research

1. **Search the codebase**
    - Find the code related to the problem
    - Identify where the issue manifests or where changes are needed
    - Look for similar patterns or related functionality
    - Find implementation conventions to follow (coding style, test patterns,
      error handling approach)

2. **Analyze the findings**
    - For bugs: identify the root cause
    - For refactoring: find all usages and dependencies
    - For configuration: understand existing patterns

3. **Identify edge cases**
    - Boundary conditions related to the fix
    - Related failure modes the same fix should cover
    - Inputs or states that could break the proposed solution

4. **List affected files**
    - Identify all files that need modification
    - Note any test files that need updates
    - Flag any configuration or documentation changes

### Phase 3: Solution Design

1. **Propose the solution**
    - Describe the fix or change approach
    - Keep it minimal and focused
    - Note any alternative approaches considered

2. **Identify entities** (if the task adds new functionality or changes
   existing entities)
    - What entities are involved
    - Key attributes and relationships
    - Validation rules from requirements
    - Skip this step for minor bug fixes and refactorings

3. **Define verification steps**
    - How to verify the fix works
    - What tests to run
    - Any manual verification needed

### Phase 4: Complexity Check

1. **Evaluate task complexity**
    - Check for indicators that suggest full SDD is needed:
        - Multiple unrelated components affected
        - New entities or data models required
        - API contract changes
        - New user-facing features
        - Cross-cutting concerns (auth, logging, etc.)

2. **Recommend workflow**
    - If complexity indicators found: recommend `/sdd-spec` instead
    - If task is straightforward: proceed with quick spec

### Phase 5: Write Quick Spec

1. **Create the quick spec file**
    - Write to `{specs_dir}/quick.md`
    - Create the `{specs_dir}/` directory if it doesn't exist
    - Use the template structure below

2. **Review the output**
    - Verify problem is clearly stated
    - Confirm affected files are identified
    - Check that solution is actionable

## Quick Spec Template

```markdown
# Quick Spec: [BRIEF TITLE]

**Created**: [DATE]
**Status**: Draft
**Model**: [MODEL_NAME MODEL_VERSION THINKING_EFFORT]
**SDD Version**: [version from the metadata comment at the top of this file]
**Type**: [Bug Fix | Refactoring | Configuration | Documentation | Other]
**Input**: User description: "$ARGUMENTS"

## Problem

[Clear description of what needs to be fixed or changed]

## Research Findings

[Summary of codebase analysis]

### Root Cause

[For bugs: explain why the issue occurs]
[For other tasks: explain current state and why change is needed]

### Affected Files

- `path/to/file1.ext` - [what needs to change]
- `path/to/file2.ext` - [what needs to change]

### Patterns to Follow

[Coding conventions, similar implementations, test patterns found in the
codebase that the implementation should follow]

### Edge Cases

- [Boundary condition or related failure mode]
- [Input or state that could break the fix]

### Entities

<!--
  Include only if the task adds new functionality or changes existing entities.
  Remove this section for minor bug fixes and refactorings.
-->

- **[Entity]**: [Key attributes, relationships, validation rules]

## Solution

[Describe the proposed fix or change]

### Tasks

- [ ] **Task 1**: [Concrete action with file path]
    - Verification: [How to verify this step]
- [ ] **Task 2**: [Concrete action with file path]
    - Verification: [How to verify this step]

### Alternatives Considered

[Optional: other approaches and why they were not chosen]

## Verification

- [ ] [How to verify the fix works]
- [ ] [Tests to run]
- [ ] [Any manual checks needed]

## Notes

[Optional: any additional context, risks, or considerations]
```

## Guidelines

- **Stay focused**: Quick specs are for small, well-defined tasks
- **Research first**: Understand the problem before proposing solutions
- **Minimal scope**: If the task grows, recommend full SDD instead
- **Be specific**: List exact files and changes needed
- **Verify feasibility**: Ensure the solution is implementable
- **Document assumptions**: Note any assumptions made during analysis
