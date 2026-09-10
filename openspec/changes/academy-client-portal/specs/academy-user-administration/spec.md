# Academy User Administration Specification

## Purpose

Allow administrators to manage individual academy accounts safely and provide a TTY-only recovery path for administrator creation.

## Requirements

### Requirement: Account identity and creation lifecycle

The system MUST identify users by UUID. A user MUST have display name, username, normalized username, role, password hash, forced-password-change state, lifecycle timestamps, and creation/update timestamps. Persisted usernames MUST be 4--30 characters from `a-z`, `0-9`, `.`, `_`, and `-` after normalization. The system MUST enforce normalized-username uniqueness among non-deleted users while permitting reuse after soft deletion. Administrator web creation MUST create parent accounts with a generated 10-character temporary password from an alphabet excluding ambiguous glyphs, set `mustChangePassword`, and return that plaintext exactly once.

#### Scenario: Parent creation returns the temporary password once

- GIVEN an authenticated administrator supplies a valid unique parent display name and username
- WHEN the administrator creates the account
- THEN the system MUST create a parent with `mustChangePassword` set and return its generated 10-character temporary password only in that creation response

#### Scenario: Soft-deleted username can be reused

- GIVEN a soft-deleted user has a normalized username
- WHEN an administrator creates a non-deleted user with that normalized username
- THEN the system MUST permit the new account while continuing to reject a duplicate among non-deleted accounts

### Requirement: Administrator user discovery and lifecycle controls

The system MUST expose administrator-only user operations through `GET` and `POST /api/academy/admin/users`, `GET`, `PATCH`, and `DELETE /api/academy/admin/users/:id`, `POST /api/academy/admin/users/:id/enable`, and `POST /api/academy/admin/users/:id/reset-password`. Administrators MUST be able to inspect, create, search, filter, enable, disable, soft-delete, and reset users through those APIs. Lists MUST use server-side pagination; search MUST cover display name, normalized username, and UUID; filters MUST support role and active, disabled, and deleted lifecycle status. UUIDs MUST be returned only to administrators. Disable and soft delete MUST revoke all user sessions. The portal MUST NOT expose restoration of a soft-deleted user.

#### Scenario: Administrator filters a paginated user list

- GIVEN multiple users with distinct roles and lifecycle states
- WHEN an administrator requests a page with a role or lifecycle filter and a display-name, normalized-username, or UUID search term
- THEN the system MUST return only matching administrator-visible records and pagination metadata without password material

#### Scenario: Disabled user loses access

- GIVEN a user has an active bearer session
- WHEN an administrator disables that user
- THEN the user MUST be excluded from active access and their session MUST be rejected immediately

### Requirement: Last active administrator protection

The system MUST transactionally reject a disable or soft-delete mutation that would leave zero active, non-deleted administrators. Re-enabling a disabled administrator MAY be allowed. Conflict responses MUST make this lifecycle constraint clear without exposing secrets.

#### Scenario: Sole active administrator cannot be disabled

- GIVEN exactly one active, non-deleted administrator exists
- WHEN that administrator is disabled or soft-deleted
- THEN the system MUST reject the mutation and preserve the active administrator

### Requirement: Password reset secrecy

An administrator MUST be able to reset a user password. Reset MUST generate a replacement temporary password, set `mustChangePassword`, revoke all sessions transactionally, and return the plaintext password exactly once. Passwords and password hashes MUST NOT appear in later responses, logs, or audit details. A parent MUST be able to change only their own password and MUST NOT reset another user.

#### Scenario: Reset password invalidates previous access

- GIVEN a user has one or more active sessions
- WHEN an administrator resets that user's password
- THEN the reset response MUST contain the new temporary password once and all prior sessions MUST be denied

### Requirement: TTY-only administrator bootstrap and recovery

The backend CLI MUST be the only path to create an initial or recovery administrator. It MUST prompt on an interactive TTY for display name, valid username, and a hidden password entered twice; it MUST require matching passwords of at least 10 characters. The CLI MUST fail without creating an account when standard input is non-interactive or validation fails. CLI-created administrators MUST be normal database-backed administrator records and MUST record a system actor in the audit log.

#### Scenario: Non-interactive CLI fails safely

- GIVEN the create-administrator CLI is started with non-TTY standard input
- WHEN it attempts to collect administrator credentials
- THEN it MUST fail without persisting an administrator or echoing a password
