---
description: Actualize README.md to serve as a user manual for the product
---

# Actualize README

<!-- Workflow metadata — the agent can read and use these values:
  version: v2.0.1-3-ge3e126a
  specs_dir: specs/.current
-->

Update `README.md` to serve as a user manual — documentation that explains what
the product does and how to use it. Adapt the README structure to the product
type (library, CLI/installable, API service, or web application).

## Prerequisites

Before starting, verify the repository contains these required documents:

- `DEVELOPMENT.md` — development setup and workflow
- `AGENTS.md` — LLM agent guidance
- `specs/` — directory containing feature specifications

Also check for these optional documents:

- `DEPLOYMENT.md` — installation, configuration, deployment
- `CHANGELOG.md` — changelog

If required documents are missing, ask the user whether to create them or
proceed without.

## Steps

### Phase 1: Information Gathering

1. **Read the current README.md**
    - Review the existing content
    - Note what sections exist and their quality
    - Identify content worth preserving

2. **Gather product information from the codebase**
    - Read `AGENTS.md` for project overview, technical context, and structure
    - Read `DEPLOYMENT.md` (if it exists) for understanding what the product
      does (not to copy content)
    - Read `DEVELOPMENT.md` for understanding capabilities
    - Scan `specs/` directory for feature specifications
    - Examine entry points (main files, CLI commands, API routes, UI pages)
      to understand user interactions

3. **Determine the product type**

    Classify the project into one of these product types:

    - **Library** — imported as a dependency in other projects (e.g., npm
      package, Python library, Java JAR)
    - **Installable product** — installed and run locally (e.g., CLI tool,
      desktop app, self-hosted software)
    - **API service** — consumed over network protocols (e.g., REST API,
      gRPC service, microservice)
    - **Web application** — accessed via browser (e.g., SaaS, dashboard,
      admin panel)

    Use these signals to determine the type:

    - `AGENTS.md` fields: Project Overview, Target Platform, Project Type
    - Existing README content and framing
    - Codebase indicators: package.json `main`/`exports` fields, CLI entry
      points (`bin`), API route definitions, UI frameworks, Dockerfile
      exposing ports, etc.

    If the type is ambiguous or the project spans multiple types, **ask the
    user** which type best describes the primary audience's interaction.

4. **Identify information gaps**

    After gathering information, determine if you can answer these questions:

    - What does the product do? (purpose)
    - Who is it for? (target audience)
    - What problem does it solve?
    - What are the main concepts users interact with?
    - What can users do with it? (capabilities)
    - How do users get started? (installation, first use)
    - What inputs does it accept and what outputs does it produce?

    If any critical questions cannot be answered from the codebase,
    **ask the user for clarification** before proceeding.

### Phase 2: Content Planning

1. **Plan the README structure**

    Start with the common sections required for all product types:

    - **Project name and purpose** — what it does, who it's for
    - **Key concepts** — mental model, main abstractions
    - **Documentation map** — links to other docs

    Then add sections based on the product type:

    **Library:**

    - **Installation** — how to add as a dependency (package manager commands)
    - **Quick start** — minimal usage example
    - **API overview** — main modules, functions, classes
    - **Usage examples** — common scenarios with code samples
    - **Configuration** — options, settings (if applicable)

    **Installable product:**

    - **Installation** — platform-specific install instructions
    - **Quick start** — first-use walkthrough
    - **Usage** — commands, flags, UI workflows, features
    - **Configuration** — config files, environment variables

    **API service:**

    - **Overview** — base URL, authentication, protocol
    - **Quick start** — first API call example
    - **Endpoints / capabilities** — available operations
    - **Request/response examples** — common scenarios
    - **Error handling** — error codes and meanings
    - **Rate limits / guarantees** — if applicable

    **Web application:**

    - **Access** — URL, supported browsers, authentication
    - **Quick start** — first login, key workflow walkthrough
    - **Features overview** — screens, modules, user roles
    - **Common workflows** — step-by-step guides for main tasks
    - **Configuration / administration** — if self-hosted or
      admin-configurable

2. **Draft content for each section**

    For each section, note:

    - Key points to include
    - Examples that demonstrate usage
    - Content that belongs in other docs (link, don't copy)

### Phase 3: Writing

1. **Write the README**

    Apply these rules strictly:

    **Include:**

    - What the product does and who it's for
    - Main concepts and their relationships
    - User-facing capabilities (goal-oriented)
    - Installation or access instructions appropriate to the product type
    - Usage workflows and examples
    - Input/output expectations
    - Links to other documentation

    **Exclude (move to appropriate docs if present):**

    - Production deployment procedures (belongs in `DEPLOYMENT.md`)
    - Infrastructure, CI/CD, and scaling details
    - Build steps and developer workflows (belongs in `DEVELOPMENT.md`)
    - Internal architecture details (belongs in `AGENTS.md`)

2. **Add documentation map**

    Include relative links to existing documents. Always include:

    ```markdown
    ## Documentation

    - [Development](DEVELOPMENT.md)
    - [LLM agent rules](AGENTS.md)
    - [Feature specifications](specs/)
    ```

    Add these links only if the corresponding files exist:

    - `[Deployment and configuration](DEPLOYMENT.md)`
    - `[Changelog](CHANGELOG.md)`

### Phase 4: Validation

1. **Review against requirements**

    Verify the README (common checks for all types):

    - [ ] Describes what the product does and who it's for
    - [ ] Explains key concepts users interact with
    - [ ] Lists user-facing capabilities
    - [ ] Contains usage examples
    - [ ] Links to all existing documentation files
    - [ ] Contains NO production deployment / CI/CD / infrastructure content
    - [ ] Contains NO developer build steps or internal architecture
    - [ ] Uses clear, neutral language (no marketing)

    Verify product-type-specific content:

    - [ ] **Library**: includes dependency installation and API overview
    - [ ] **Installable product**: includes install instructions and
      command/feature reference
    - [ ] **API service**: includes authentication, endpoints, and
      request/response examples
    - [ ] **Web application**: includes access instructions, features
      overview, and key workflows

2. **Format and finalize**
    - Check markdown formatting
    - Ensure consistent heading levels
    - Verify all relative links work

## Guidelines

- **User manual, not tutorial**: Write as stable reference documentation
- **Product-type-aware**: Tailor sections and depth to how users interact with
  the product
- **No duplication**: Link to other docs, don't copy their content; README
  covers user-facing setup, `DEPLOYMENT.md` covers production deployment
- **Examples show usage**: Demonstrate actual work appropriate to the product
  type
- **Ask when uncertain**: If product type or behavior is unclear, ask the user
- **Preserve valid content**: Don't discard good existing content that fits
  requirements
