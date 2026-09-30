# Publication Administration Specification

## Purpose

Allow administrators to maintain categories and publication content while preserving safe, parent-visible rendering boundaries.

## Requirements

### Requirement: Category lifecycle integrity

The system MUST expose administrator-only category operations at `GET` and `POST /api/academy/admin/categories` and `PATCH` and `DELETE /api/academy/admin/categories/:id`. Administrators MUST be able to list, create, and edit categories with UUIDs, display names, normalized unique names, and timestamps. The system MUST reject deletion of a category referenced by any publication, including hidden and soft-deleted publications. The rejection MUST be a clear conflict response and MUST leave the category and references intact.

#### Scenario: Referenced category cannot be deleted

- GIVEN a category is referenced by a hidden or deleted publication
- WHEN an administrator attempts to delete that category
- THEN the system MUST return a conflict and MUST preserve the category

### Requirement: Publication lifecycle and administration visibility

The system MUST expose administrator-only publication mutations at `POST /api/academy/admin/posts`, `PATCH /api/academy/admin/posts/:id`, and `DELETE /api/academy/admin/posts/:id`. Administrators MUST be able to create, edit, show, hide, inspect, and soft-delete publications. A new publication MUST be visible by default. Publications MUST have UUID, title, Markdown source, optional category, visibility of `visible`, `hidden`, or `deleted`, publication timestamp, update timestamp, and soft-delete metadata. A title, content, category, or visibility update MUST advance `updatedAt`. Administrator reads MUST support inspection of visible, hidden, and deleted records. The portal MUST NOT provide an endpoint to restore a deleted publication.

#### Scenario: New publication is parent-visible by default

- GIVEN an authenticated administrator creates a valid publication
- WHEN creation succeeds
- THEN the publication MUST have visible status and MUST be eligible for the parent feed

#### Scenario: Deleted publication cannot be restored through the portal

- GIVEN an administrator has soft-deleted a publication
- WHEN any portal request attempts to restore it
- THEN the system MUST not provide restoration and MUST leave the publication deleted

### Requirement: Safe Markdown source, editing, and rendering

The system MUST store Markdown source and support separate visual and source editing modes with a local preview for administrators. Rendering MUST reject raw HTML, apply explicit safe-URL handling and sanitization, and MUST NOT bind unsanitized Markdown source directly to `innerHTML`. Parent and administrator-rendered output MUST not execute raw HTML or unsafe URLs.

#### Scenario: Unsafe Markdown is not executable

- GIVEN an administrator enters Markdown containing raw HTML or an unsafe URL
- WHEN the content is previewed or returned for publication display
- THEN the rendered output MUST reject or sanitize the unsafe construct and MUST not execute it

### Requirement: Administrative mutation audit coverage

Every category and publication mutation MUST append a technical audit record identifying the actor, action, entity type, entity UUID, and timestamp. Audit records MUST NOT carry Markdown-derived secrets, passwords, or an audit payload requiring a portal UI.

#### Scenario: Publication visibility change is auditable

- GIVEN an authenticated administrator changes a publication from visible to hidden
- WHEN the mutation succeeds
- THEN the system MUST append an audit record for that publication mutation
