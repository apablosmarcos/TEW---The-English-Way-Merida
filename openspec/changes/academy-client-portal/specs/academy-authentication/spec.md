# Academy Authentication Specification

## Purpose

Provide individual, database-backed academy identity, authorization, password lifecycle, and rolling sessions.

## Requirements

### Requirement: Secure individual authentication

The system MUST authenticate academy users only through active, non-deleted database user records and opaque bearer sessions. Usernames SHALL be matched by their normalized form (trimmed, Unicode-normalized, and lowercased). Password verification MUST use salted `crypto.scrypt` password hashes and timing-safe comparison. The system MUST persist only a SHA-256 hash of each randomly generated 32-byte session token, never the token itself, and MUST return generic login failures for unknown, disabled, deleted, and invalid-password accounts.

#### Scenario: Valid normalized login creates an opaque session

- GIVEN an active user whose normalized username is unique
- WHEN the user submits that username in a different case with the correct password to `POST /api/academy/login`
- THEN the system MUST create a new opaque bearer session, persist only its token hash, and return the token, current user, expiry, and `mustChangePassword` state

#### Scenario: Failed login does not disclose account state

- GIVEN a login request for an unknown, disabled, deleted, or wrong-password account
- WHEN the request is processed
- THEN the system MUST return the same generic authentication failure without returning a password hash, token, or account-state detail

### Requirement: Session endpoint contract

The system MUST expose `POST /api/academy/login` publicly, and MUST expose `GET /api/academy/session`, `POST /api/academy/logout`, and `POST /api/academy/me/password` only to authenticated users. The session inspection response MUST omit password material and physical storage data. Logout MUST invalidate the presented session token.

#### Scenario: Logout invalidates the presented session

- GIVEN an authenticated user has a valid academy bearer token
- WHEN the user posts to `/api/academy/logout`
- THEN the system MUST invalidate that token and deny it on subsequent authenticated requests

### Requirement: Rolling session authorization and revocation

Each authenticated request MUST resolve a session joined to an active, non-deleted user. The system MUST reject and remove expired sessions, update `lastSeenAt`, and extend a valid session expiry to exactly eight hours after the request. A user MAY hold simultaneous sessions. Password change, administrator password reset, disable, and soft delete MUST revoke all sessions for the affected user within the same database transaction. Authentication middleware MUST expose the current user, and administrator middleware MUST require `role = admin`.

#### Scenario: Active request rolls session expiry

- GIVEN a valid academy session expiring in less than eight hours
- WHEN its user makes an authenticated request
- THEN the request MUST be authorized and the persisted expiry MUST become eight hours after that request

#### Scenario: Security-sensitive lifecycle change revokes every device

- GIVEN a user has multiple valid sessions
- WHEN the user's password is changed or reset, or the account is disabled or soft-deleted
- THEN all of that user's sessions MUST be removed transactionally and every prior bearer token MUST be denied on its next request

#### Scenario: Non-administrator cannot invoke administrator operation

- GIVEN an authenticated parent session
- WHEN it requests an `/api/academy/admin` operation
- THEN the system MUST deny the operation without performing the requested mutation

### Requirement: Forced password change boundary

A user with `mustChangePassword` set MUST be permitted only to inspect the current session, change their own password, or log out. Every other private operation MUST return a consistent password-change-required response until the password change succeeds. A self-service password change MUST apply only to the current user, clear `mustChangePassword`, and revoke all prior sessions without persisting, logging, or auditing plaintext password material.

#### Scenario: Temporary-password user is blocked from portal content

- GIVEN an authenticated user with `mustChangePassword` set
- WHEN the user requests publications or an administrator operation
- THEN the system MUST return the password-change-required response and MUST not expose the requested resource

#### Scenario: Password change unlocks a new session

- GIVEN a temporary-password user changes their own password successfully
- WHEN the user subsequently authenticates with the new password
- THEN the system MUST allow normal role-authorized access and MUST reject all sessions issued before the change

### Requirement: Bounded login abuse protection

`POST /api/academy/login` MUST enforce a bounded in-memory limiter keyed by request IP, allowing at most 10 attempts per IP during a 15-minute window and returning `429` after that limit. The limiter MAY reset on process restart. The system MUST NOT use the `Origin` header as the limiter key. Production deployments SHALL enable Express `trust proxy` only for a known proxy topology.

#### Scenario: Excess login attempts are throttled

- GIVEN an IP address has made 10 login attempts within 15 minutes
- WHEN it makes an eleventh login request in that window
- THEN the system MUST return `429` before issuing a session
