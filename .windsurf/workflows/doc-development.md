---
description: Actualize DEVELOPMENT.md to serve as a complete development guide
---

# Actualize DEVELOPMENT.md

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Update `DEVELOPMENT.md` to comply with the development guide requirements: a
comprehensive guide for developers that explains how to set up the development
environment, run the project locally, and contribute code.

## Prerequisites

Before starting, verify the repository contains these required documents:

- `README.md` — project overview and user manual
- `AGENTS.md` — LLM agent guidance and code guidelines

Also check for these optional documents:

- `CHANGELOG.md` — changelog

If required documents are missing, ask the user whether to create them or
proceed without.

## Steps

### Phase 1: Information Gathering

1. **Read the current DEVELOPMENT.md**
   - Review the existing content
   - Note what sections exist and their quality
   - Identify incomplete or generic content that needs to be filled in
   - Identify outdated or incorrect information

2. **Gather development information from the codebase**
   - Read `AGENTS.md` for:
     - Language/version requirements
     - Build and test commands
     - Project structure
     - Technical context
   - Read `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, or other
     dependency files to understand:
     - Required tools and versions
     - Available scripts/commands
     - Dependencies
   - Examine configuration files (`.env.example`, `docker-compose.yml`, etc.)
   - Look for existing documentation in code comments or READMEs in subdirectories

3. **Identify information gaps**
   After gathering information, determine if you can answer these questions:
   - What tools are required to develop? (language runtime, package manager)
   - How do you install dependencies?
   - How do you configure the environment?
   - How do you run the project locally?
   - How do you run tests?
   - How do you lint/format code?
   - How do you build for production?
   - What is the branching/PR workflow?
   - What are common development tasks?
   - What are common issues and solutions?

   If any critical questions cannot be answered from the codebase,
   **ask the user for clarification** before proceeding.

### Phase 2: Content Planning

1. **Plan the DEVELOPMENT.md structure**
   Ensure these sections are present:
   - Prerequisites (required tools and versions)
   - Getting Started (clone, install, configure, run)
   - Development Workflow (branching, code style, testing, building)
   - Common Tasks (project-specific workflows)
   - Troubleshooting (common issues and solutions)
   - Additional Resources (links to related docs)

2. **Map information to sections**
   For each section, note:
   - Specific commands to include
   - Configuration steps needed
   - Content to update or remove (outdated info, incorrect commands)

### Phase 3: Writing

1. **Update the DEVELOPMENT.md**
   Apply these rules strictly:

   **Include:**
   - Specific tool versions required (not just "Node.js" but "Node.js 20.x")
   - Exact commands that work (test them if possible)
   - Step-by-step setup instructions
   - Environment variable documentation
   - All available npm scripts / make targets / CLI commands
   - Debugging tips and IDE configuration
   - Common issues developers encounter

   **Exclude:**
   - Deployment instructions (belongs in DEPLOYMENT.md, if it exists)
   - User-facing documentation (belongs in README.md)
   - Code guidelines (belongs in AGENTS.md)
   - Production configuration (belongs in DEPLOYMENT.md, if it exists)

2. **Ensure all content is project-specific**
   - Replace generic examples with project-specific commands
   - Remove sections that don't apply to this project

3. **Ensure commands are accurate**
   - Verify commands match what's in `package.json` scripts, `Makefile`, etc.
   - Use the exact command syntax from the project

### Phase 4: Validation

1. **Review against requirements**
   Verify the DEVELOPMENT.md:
   - [ ] Lists all required tools with versions
   - [ ] Provides complete setup instructions
   - [ ] Documents all available development commands
   - [ ] Explains the contribution workflow
   - [ ] Includes troubleshooting for common issues
   - [ ] Links to related documentation
   - [ ] Contains NO deployment/production content
   - [ ] Contains NO generic or incomplete content
   - [ ] All commands are accurate and tested

2. **Format and finalize**
   - Check markdown formatting
   - Ensure consistent heading levels
   - Verify all relative links work
   - Ensure code blocks have language specifiers

## Guidelines

- **Developer-focused**: Write for someone setting up the project for the first
  time
- **Specific over generic**: Use exact versions, exact commands, exact paths
- **Actionable**: Every section should tell the developer what to do
- **No duplication**: Link to AGENTS.md for code guidelines; link to
  DEPLOYMENT.md for deployment if it exists
- **Ask when uncertain**: If setup steps are unclear, ask the user
- **Preserve valid content**: Don't discard good existing content that fits
  requirements
- **Test commands**: When possible, verify commands work before documenting them
