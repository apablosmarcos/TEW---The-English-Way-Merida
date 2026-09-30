# Attachment Management Specification

## Purpose

Provide validated, durable publication materials while preventing filename, type, and visibility bypasses.

## Requirements

### Requirement: Validated attachment upload limits

The system MUST expose multipart upload at `POST /api/academy/admin/posts/:id/attachments`, attachment rename and soft delete at `PATCH` and `DELETE /api/academy/admin/attachments/:id`, and authenticated streams at `GET /api/academy/attachments/:id/preview` and `GET /api/academy/attachments/:id/download`. Administrators MUST upload attachments only to existing administrator-manageable publications. Each publication MUST have no more than 10 attachments total, and each upload MUST be no larger than 20 MiB. The system MUST accept only PDF, JPEG, PNG, and WebP after validating both declared MIME type and file signature. It MUST reject excess count, oversize, unsupported MIME type, and invalid or mismatched signatures without creating usable attachment metadata or serving the submitted file.

#### Scenario: Invalid signature is rejected despite declared MIME type

- GIVEN an administrator submits a file declared as PNG whose signature is not PNG
- WHEN the system validates the multipart upload
- THEN the upload MUST be rejected and MUST not create an accessible attachment

#### Scenario: Eleventh attachment is rejected

- GIVEN a publication already has 10 attachments
- WHEN an administrator uploads another attachment
- THEN the system MUST reject the upload and preserve the existing attachments

### Requirement: Opaque durable file storage and metadata lifecycle

The system MUST store each accepted file under an opaque generated identifier plus a server-chosen extension derived from its validated type. Original client filenames MUST NOT be used as storage names or exposed. Attachment metadata MUST include UUID, publication UUID, opaque storage identifier, validated extension and MIME type, byte size, optional visible title, stable per-publication material ordinal, timestamps, and soft-delete metadata. A failed upload MUST NOT leave attachment metadata that refers to unavailable file content or make submitted content parent-accessible. `FILE_STORAGE_PATH` MUST be configurable and default under `backend/data/uploads`. Soft deletion MUST hide attachment metadata from parents while retaining the physical file and administrator access.

#### Scenario: Upload preserves no client filename

- GIVEN an administrator uploads `untrusted-name.pdf` as a valid PDF
- WHEN the upload is stored and later listed
- THEN the physical storage name and returned attachment metadata MUST NOT expose `untrusted-name.pdf`

#### Scenario: Soft deletion retains administrator-recoverable material

- GIVEN an active attachment exists on a publication
- WHEN an administrator soft-deletes it
- THEN parents MUST no longer receive its metadata while an administrator MAY still inspect it and the physical file MUST remain retained

### Requirement: Safe authenticated preview and download

Preview and download MUST be authenticated routes that recheck attachment and publication access for every request. Responses MUST use the exact validated `Content-Type`, `X-Content-Type-Options: nosniff`, and safe `Content-Disposition`: `inline` for preview and `attachment` for download. The filename MUST be a sanitized visible attachment title, or stable `Material N` fallback, plus the validated extension. Attachment display order MUST be alphabetical by that visible or fallback title.

#### Scenario: Download response uses validated safe headers

- GIVEN an authorized request for a valid JPEG attachment with no visible title and ordinal 2
- WHEN the user downloads it
- THEN the response MUST set its validated JPEG content type, `X-Content-Type-Options: nosniff`, attachment disposition, and a sanitized `Material 2` filename with the JPEG extension

#### Scenario: Unauthorized stream is not served

- GIVEN an unauthenticated request or a parent request for a hidden publication's attachment
- WHEN it requests preview or download
- THEN the system MUST deny the request without streaming file bytes

### Requirement: Attachment mutation audit coverage

Attachment upload, rename, and soft-delete mutations MUST append technical audit records without plaintext credentials, original client filenames, or physical storage identifiers.

#### Scenario: Attachment rename is auditable without storage disclosure

- GIVEN an administrator renames an attachment's visible title
- WHEN the mutation succeeds
- THEN the system MUST append an audit record for the attachment mutation without its physical storage identifier
