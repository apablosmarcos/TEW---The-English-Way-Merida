# Proposal: Academy client portal

## Problem

The public site already sends enrolment enquiries to Google Forms, but the repository still carries a stale lead intake API, an environment-variable admin identity, lead-management screens, and related storage and tests. At the same time, academy families have no private place to access publications and learning materials, and staff have no database-backed way to manage parent access or portal content.

Keeping the obsolete lead/admin area would preserve two conflicting administration models and leave the new portal dependent on authentication that cannot represent individual users, roles, revocation, or secure per-request content access.

## Intent

Replace the obsolete leads/admin area with a private academy client portal for parents and administrators. The portal will provide database-backed identities, secure rolling sessions, parent-visible publications and attachments, administrator-managed users and content, and a recovery CLI for administrator bootstrap.

This is a replacement, not an adaptation of the lead workflow. Historic lead and old-session rows remain physically preserved but inert.

## Goals

- Give parents one authenticated portal where they can browse, search, filter, and open current academy publications and supported attachments.
- Give administrators one authenticated workspace to manage parent/admin accounts, categories, publications, visibility, and attachments.
- Replace the shared environment-variable administrator with individual, database-backed users and role-based authorization.
- Enforce first-login password changes, rolling eight-hour sessions, immediate session revocation, generic login failures, and a bounded IP-based login limiter.
- Protect hidden, deleted, and parent-inaccessible content on every server request, including direct attachment URLs.
- Store Markdown and uploaded files safely, with explicit type/signature checks, safe rendering, sanitized download names, and durable deployment storage.
- Remove active lead collection and lead administration code while retaining the existing Google Forms enrolment call to action.
- Preserve historic `leads` and `admin_sessions` tables without allowing them to authenticate or participate in the academy portal.

## Non-goals

- Email recovery, notifications, self-registration, or refresh tokens.
- Family/group segmentation or per-family publication targeting.
- Author display, comments, cover images, drafts, or scheduled publishing.
- Cloud/object storage, storage quotas or metrics, backup automation, or download tracking.
- Portal restoration flows for deleted users or publications; exceptional recovery remains a direct database operation.
- An audit-log user interface.
- Replacing SQLite or introducing an end-to-end test framework.
- Restoring or modernizing the obsolete lead workflow.

## Proposed scope

### Shared authentication and authorization

Add academy routes under `/api/academy` backed by `users` and `sessions` in SQLite. Usernames are normalized and unique among non-deleted accounts. Passwords use salted Node `crypto.scrypt` hashes, and only SHA-256 hashes of opaque bearer tokens are persisted.

Authenticated requests will resolve an active, non-deleted user, reject expired sessions, update `lastSeenAt`, and extend expiry to eight hours after the request. Password change/reset, disable, and soft delete revoke all sessions for the affected user. A user marked `mustChangePassword` may access only session inspection, password change, and logout until the password is changed.

Express middleware will centralize authentication and administrator authorization. Parent content visibility will be enforced by backend queries and streaming routes rather than relying on Angular guards. Login errors remain generic, and login attempts are bounded in memory by request IP.

### User administration and recovery

Administrators can create, search, filter, inspect, enable, disable, soft-delete, and reset users. Search covers display name, normalized username, and UUID; lists are paginated and filterable by role and lifecycle status.

Account creation and reset return a generated temporary password exactly once and require a password change. Plaintext passwords are never persisted, logged, or included in audit details. A transactional guard prevents disabling or deleting the last active administrator.

A TTY-only backend CLI creates the initial administrator and may create a later recovery administrator. It requires hidden password confirmation and fails safely for non-interactive input.

### Publications and categories

Administrators can manage categories and create, edit, show, hide, and soft-delete publications. New publications are visible by default. Deleted publications have no portal restoration endpoint. Categories cannot be removed while referenced by any publication, including hidden or deleted records.

Parents see only visible publications, newest first, with title search, category filtering, and server-side pagination. Publication detail includes dates, category, safely rendered Markdown, and active attachments, but no author identity. Administrators can inspect visible, hidden, and deleted publications.

Markdown source is stored and edited through separate visual and source modes with local preview. Rendering must reject raw HTML and apply explicit safe-URL handling and sanitization; unsanitized source must never be bound directly to `innerHTML`. Implementation may add one small maintained safe Markdown-rendering dependency rather than a custom renderer.

### Attachments and durable storage

Administrators can upload, rename, and soft-delete up to 10 attachments per publication, each no larger than 20 MiB. The backend accepts only PDF, JPEG, PNG, and WebP after validating declared MIME type and file signature, then chooses the extension and stores the file under an opaque generated identifier. Original client filenames are not used as storage names or exposed.

Preview and download remain authenticated routes. Each request rechecks publication and attachment visibility, then sends validated content headers, `nosniff`, safe disposition, and a sanitized title derived from the visible attachment title or stable `Material N` fallback. Soft deletion hides attachment metadata from parents but retains the physical file and administrator access. Implementation may add one small maintained multipart dependency rather than a bespoke parser.

Uploads use a configurable `FILE_STORAGE_PATH`, defaulting under `backend/data/uploads`, and deployment guidance must place uploads and SQLite on durable storage.

### Audit and operations

Append-only technical audit records cover account, password-reset, category, publication, and attachment mutations without recording passwords. The administrator CLI records a system actor.

Documentation, runtime configuration, package scripts, `.gitignore`, Docker/deployment notes, and test commands will be updated for academy bootstrap, persistent SQLite/upload paths, `/api` routing, and the limitation that a GitHub Pages deployment is visual-only without a backend API.

## Affected capabilities

| Capability | Change |
| --- | --- |
| Academy authentication | Add database users, role-aware authorization, rolling opaque sessions, forced password change, revocation, and login throttling. |
| Academy frontend | Add shared role-aware login, forced-password-change routing, responsive parent/admin shells, and authenticated navigation. |
| Parent publication access | Add authenticated publication feed/detail, title search, category filtering, pagination, and attachment access. |
| Academy user administration | Add account lifecycle management, one-time temporary passwords, last-active-admin protection, and recovery CLI. |
| Publication administration | Add category and publication lifecycle management, Markdown editing/preview, and visibility inspection. |
| Attachment management | Add validated multipart upload, durable file storage, metadata lifecycle, and protected preview/download. |
| Auditability | Add append-only technical mutation records without a portal audit UI. |
| Public enrolment | Keep the Google Forms enrolment journey; remove unused in-repository lead submission plumbing. |
| Legacy administration | Remove active lead APIs, admin login, lead-management UI/routes, configuration, and tests. |
| Deployment | Add durable upload storage and database-backed administrator bootstrap requirements. |

## User outcomes

### Parents

- Sign in through `/academia/acceso` with an individually managed account.
- Must replace a temporary password before using private portal features.
- Browse current publications from `/academia`, search by title, filter by category, paginate, read safe formatted content, and preview or download supported materials.
- Immediately lose access to hidden/deleted content, revoked sessions, or a disabled/deleted account, including through previously copied direct URLs.

### Administrators

- Land on `/academia/admin/publicaciones` and manage publication visibility, categories, content, and attachments.
- Manage users through `/academia/admin/usuarios`, including searchable/paginated account lists and one-time temporary-password creation/reset flows.
- See clear conflict messaging when a category is in use or an account mutation would remove the last active administrator.
- Use the server-side CLI to bootstrap or recover administrator access without relying on shared environment credentials.

### Public-site visitors

- Continue to use Google Forms for enrolment.
- See an **Acceso academia** entry when anonymous; authenticated users see a username menu with portal navigation and logout.

## Migration and removal of the obsolete leads/admin area

- Remove registrations and active code for public lead intake, environment-variable admin authentication, authenticated lead management, the Angular `/admin` and `/admin/leads` screens, lead/admin services, obsolete home-form state/submission code, and their tests.
- Retain the public Google Forms enrolment section and remove only lead-specific plumbing and styling that becomes unused.
- Stop creating, importing into, querying, or authenticating through the legacy `leads` and `admin_sessions` tables.
- Do **not** drop those tables or delete their rows. Existing databases may contain historic records, so the tables remain inert and available for controlled archival or recovery needs.
- Add the academy schema idempotently with foreign-key enforcement. New user, session, category, publication, attachment, and audit records are separate from legacy lead/admin data; no automatic data conversion is proposed.
- Retire `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_TTL_HOURS`, and `LEGACY_LEADS_FILE_PATH` from runtime guidance. Initial access moves to the academy administrator CLI, and `FILE_STORAGE_PATH` is added.
- Replace `/admin` and `/admin/leads` with role-guarded academy routes; no compatibility redirect to the obsolete lead panel is required.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Unauthorized access to hidden/deleted publications or attachments | Enforce identity, role, publication visibility, and attachment lifecycle checks server-side on every read and stream request; cover stale direct URLs in route tests. |
| Password or token disclosure | Store salted password hashes and token hashes only; return temporary passwords once; exclude secrets and physical storage identifiers from responses, logs, and audits. |
| Account lockout or removal of all administrators | Provide a repeatable TTY recovery CLI and transactionally reject mutations that would leave no active administrator. |
| Unsafe Markdown or uploaded content | Reject raw HTML, sanitize rendered output and URLs, validate MIME plus file signatures, choose server-side extensions, set exact headers and `nosniff`, and never trust original filenames. |
| File/database inconsistency or lost uploads | Use a configured durable upload path alongside persistent SQLite deployment storage; make metadata/file ordering explicit and retain files on soft delete. |
| Historic lead data loss | Leave legacy tables and rows untouched while removing all active application use and legacy import behavior. |
| Session abuse or username enumeration | Use generic login errors, timing-safe password comparison, IP-based bounded throttling, rolling expiry, and immediate all-session revocation for security-sensitive account changes. |
| Incorrect proxy-derived client IP | Enable Express `trust proxy` only for a known production proxy topology and document the requirement. |
| Broad replacement exceeds review capacity | The change is expected to exceed the 400-line review budget. Under `ask-on-risk`, implementation must pause for an explicit delivery strategy before apply; no chain strategy or size exception is assumed. |
| Deployment without a backend API | Document that GitHub Pages can render only the public site and cannot provide portal login or private content without `/api` and persistent backend storage. |

## Rollback

Rollback is deployment-oriented rather than destructive:

1. Stop academy writes and preserve a backup of the SQLite database and upload directory.
2. Redeploy the prior application and restore its required environment configuration if emergency rollback is necessary.
3. Leave additive academy tables and uploaded files in place for later recovery; do not attempt an automatic reverse migration.
4. Because legacy `leads` and `admin_sessions` tables are never dropped, a prior release can still read its historic schema where operationally required.

Academy users, publications, and attachments are not converted back into leads. Any later re-enable should reuse the preserved academy data after compatibility verification.

## Success criteria

- The application exposes health plus the planned `/api/academy` surface and no longer registers active lead or legacy admin routes.
- A clean installation can create an administrator through the TTY CLI, sign in, and use the academy administration area without `ADMIN_USERNAME` or `ADMIN_PASSWORD`.
- An administrator can create a parent, receive the temporary password once, and the parent must change it before accessing publications.
- Parent list/detail responses show only visible publications and active attachments; hidden/deleted resources and stale direct file URLs are denied immediately.
- Administrators can manage users, categories, publications, visibility, and supported attachments while last-active-admin and category-in-use rules are enforced.
- Authentication supports normalized usernames, simultaneous sessions, rolling eight-hour expiry, generic failures, login throttling, and all-session revocation after password reset/change, disable, or delete.
- Markdown is rendered without raw HTML execution or unsafe URLs, and attachment uploads reject excess count, oversize files, unsupported MIME types, and invalid signatures.
- Preview/download responses use validated content types, safe disposition names, and `X-Content-Type-Options: nosniff`.
- Existing `leads` and `admin_sessions` tables and rows remain present but are no longer created, imported into, queried, or used for authentication by the new application.
- The public Google Forms enrolment path remains available, while obsolete lead/admin frontend code, backend code, configuration, routes, and tests are removed.
- Deployment documentation covers initial administrator creation, `/api` routing, durable SQLite/upload storage, proxy trust constraints, and GitHub Pages limitations.
- Focused backend and Angular tests cover the lifecycle, authorization, filtering, upload, CLI-helper, interceptor, guard, and forced-password-change behavior described in exploration.
- `pnpm --recursive test` and `pnpm --recursive run build` pass, followed by the documented clean-data-path administrator/parent/publication/attachment manual smoke flow.

## Planning constraints

- This proposal is based only on `openspec/changes/academy-client-portal/exploration.md`, which is authoritative for product decisions and repository evidence.
- External research is unselected; no research findings or additional scope are inferred.
- This phase is planning only and changes no product code.
- Before implementation, the proposal must be elaborated into specifications, design, and reviewable work units. The configured `ask-on-risk` delivery gate remains unresolved because the expected implementation exceeds the 400-line review budget.
