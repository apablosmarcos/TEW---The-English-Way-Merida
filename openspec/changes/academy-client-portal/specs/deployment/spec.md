# Academy Deployment Specification

## Purpose

Make academy data and private API behavior deployable without relying on deprecated shared credentials or ephemeral storage.

## Requirements

### Requirement: Persistent academy runtime configuration

Runtime and deployment documentation MUST configure `FILE_STORAGE_PATH`, defaulting to `backend/data/uploads`, and MUST require durable storage for both SQLite and uploaded files across deployment replacement or restart. Upload storage MUST be excluded from source control. Runtime guidance MUST retire `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TTL_HOURS`, and `LEGACY_LEADS_FILE_PATH`; initial and recovery administrator access MUST use the TTY CLI.

#### Scenario: Clean durable deployment is bootstrapped through CLI

- GIVEN a clean deployment has durable SQLite and upload paths configured
- WHEN an operator creates the first administrator
- THEN the documented flow MUST use the interactive academy administrator CLI and MUST not require deprecated environment credentials

### Requirement: Private API routing and static-host limitation

Deployment documentation MUST specify routing `/api` to the backend API and MUST state that GitHub Pages can render only the visual public site; academy login and private content SHALL not be represented as functional without a reachable backend API and persistent backend storage.

#### Scenario: Static-only host does not promise portal operation

- GIVEN the site is deployed only to GitHub Pages without a backend API
- WHEN an operator follows deployment guidance
- THEN the guidance MUST identify the portal as unavailable rather than claiming login or private content will function

### Requirement: Proxy trust boundary and operational validation

Deployment guidance MUST state that Express `trust proxy` MAY be enabled only for a known production proxy topology, because login rate limiting uses request IP. The documented validation commands MUST include `pnpm --recursive test` and `pnpm --recursive run build`, followed by a clean-data-path administrator/parent/publication/attachment smoke flow.

#### Scenario: Unknown proxy topology remains untrusted

- GIVEN an operator cannot identify the production proxy topology
- WHEN configuring the backend
- THEN deployment guidance MUST not direct the operator to enable Express `trust proxy`
