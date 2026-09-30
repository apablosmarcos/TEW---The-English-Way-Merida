# Parent Publication Access Specification

## Purpose

Give authenticated academy parents a private, current-only publication library and protected material access.

## Requirements

### Requirement: Parent publication feed and discovery

The system MUST expose authenticated publication list and detail reads at `GET /api/academy/posts` and `GET /api/academy/posts/:id`. Authenticated parents MUST receive only visible, non-deleted publications, ordered newest first. The feed MUST support server-side pagination, title-only search, and an optional category filter including an All choice. Parent responses MUST NOT include hidden or deleted publication metadata, author identity, or deleted attachment metadata.

#### Scenario: Parent filters visible publications

- GIVEN visible, hidden, and deleted publications across categories
- WHEN an authenticated parent searches by title and selects a category
- THEN the system MUST return only matching visible publications in newest-first paginated order

#### Scenario: Parent cannot discover hidden publication through list filters

- GIVEN a hidden publication has a matching title and category
- WHEN a parent uses those exact list filters
- THEN the hidden publication MUST not appear and its metadata MUST not be returned

### Requirement: Protected publication detail

An authenticated parent MUST be able to read a visible publication by UUID. Detail MUST expose publication date, updated date, assigned category when present, safely rendered Markdown, and active attachment links; it MUST NOT expose author identity. The server MUST re-evaluate user authentication and publication visibility on every detail request and deny hidden, deleted, or inaccessible records, including guessed or stale direct URLs.

#### Scenario: Hidden publication becomes inaccessible immediately

- GIVEN a parent previously opened a visible publication URL
- WHEN an administrator hides or soft-deletes that publication
- THEN the parent's subsequent request to that same URL MUST be denied without returning publication content or metadata

### Requirement: Parent attachment access is derived from current publication access

Parents MUST access attachment previews and downloads only through authenticated routes. For every stream request, the server MUST resolve the attachment and its publication and MUST permit a parent only when the attachment is active and its publication is visible. The system MUST deny stale copied preview or download URLs immediately when the user, publication, or attachment no longer satisfies those conditions.

#### Scenario: Deleted attachment URL is denied

- GIVEN a parent has copied a valid download URL for an active attachment on a visible publication
- WHEN an administrator soft-deletes the attachment
- THEN a request using that copied URL MUST be denied and MUST not stream the retained physical file
