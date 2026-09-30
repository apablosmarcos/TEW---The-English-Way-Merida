# Legacy Administration Specification

## Purpose

Remove the obsolete shared-credential lead administration model without deleting historic database evidence.

## Requirements

### Requirement: Legacy administration removal

The application MUST remove active public lead intake routes, environment-variable administrator authentication, authenticated lead-management routes, lead/admin frontend screens and services, obsolete home lead-form submission state, related configuration, and their tests. It MUST no longer register active lead or legacy administrator routes. The application MUST replace the former `/admin` and `/admin/leads` experience with role-guarded academy routes and MUST NOT provide a compatibility redirect to the obsolete lead panel.

#### Scenario: Obsolete lead endpoint is unavailable

- GIVEN the academy release is running
- WHEN a client requests a formerly registered lead submission, legacy admin login, or lead-management route
- THEN the application MUST not provide the obsolete active behavior

### Requirement: Legacy tables remain physically preserved and unauthenticated

Schema initialization and migrations MUST NOT drop `leads` or `admin_sessions` tables or delete their existing rows. New academy users, sessions, categories, publications, attachments, and audit records MUST be separate from those tables. Legacy `admin_sessions` rows MUST NOT authenticate a user, and no automatic lead or session data conversion MUST occur.

#### Scenario: Old session cannot enter academy portal

- GIVEN an existing database contains a historic `admin_sessions` row
- WHEN a client presents information associated with that legacy session to an academy route
- THEN the academy route MUST deny authentication and MUST use only the new session store

### Requirement: Academy schema migration is additive and referentially enforced

The academy schema MUST initialize idempotently and MUST enable SQLite foreign-key enforcement. Re-running initialization MUST preserve existing academy and legacy records without duplicating schema effects.

#### Scenario: Initialization is safely repeatable

- GIVEN a database already initialized with academy tables and historic legacy tables
- WHEN schema initialization runs again
- THEN it MUST complete without dropping historic tables or records and MUST keep foreign-key enforcement enabled
