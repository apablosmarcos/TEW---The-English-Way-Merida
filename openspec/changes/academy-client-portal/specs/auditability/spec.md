# Auditability Specification

## Purpose

Maintain append-only technical evidence for sensitive academy mutations without exposing an audit-log portal or secrets.

## Requirements

### Requirement: Append-only academy mutation audit

The system MUST append a technical audit record for account, password-reset, category, publication, and attachment mutations. Each record MUST contain a nullable actor user UUID, action, entity type, entity UUID, and timestamp. The administrator CLI MUST use a system actor. Audit records MUST be append-only and the portal MUST NOT provide an audit-log user interface.

#### Scenario: Administrator account mutation is recorded

- GIVEN an authenticated administrator creates, disables, or soft-deletes an account
- WHEN the mutation succeeds
- THEN the system MUST append an audit record identifying the administrator and affected account UUID

#### Scenario: CLI mutation uses system actor

- GIVEN the TTY CLI successfully creates a recovery administrator
- WHEN the new account is committed
- THEN the system MUST append an audit record with the system actor

### Requirement: Audit secrecy boundary

Audit records, responses, and audit details MUST NOT contain plaintext passwords, password hashes, bearer tokens or token hashes, original upload filenames, physical storage identifiers, or password-bearing payloads.

#### Scenario: Password reset leaves no password in audit output

- GIVEN an administrator resets a user password
- WHEN the reset and audit record are created
- THEN the one-time plaintext password MUST be absent from the audit record and all later audit-facing data
