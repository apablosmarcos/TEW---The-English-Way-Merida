# Academy administration UX improvements

Status: documented for future sessions; no implementation is authorized yet.

## User feedback

The internal Academy experience, especially the administrative area, needs a substantial visual and usability pass:

- Bring the administration UI closer to the modern TEW visual identity already used on the public homepage.
- Establish a clear hierarchy for primary, secondary, destructive, and navigation actions.
- Make every button visibly recognizable as an interactive control; several current actions look too similar to plain text or generic fields.
- Improve spacing, typography, grouping, responsive behavior, hover/focus/disabled states, and consistency across administration pages.
- Review the complete administrator workflow instead of polishing isolated screens.

## Publication attachments

Attachment support already exists in the publication editor under **Materials**, but it is only rendered after a publication has been created (`*ngIf="id"`). This makes the feature difficult to discover when creating a new publication and likely explains why it appears to be missing.

Future work must make attachments explicit and discoverable:

- Add a clearly styled **Attach files** / **Upload material** action to the publication workflow.
- Explain whether the publication must be created before files can be uploaded, or redesign the flow so files can be staged during creation.
- Show accepted formats and size limits before selection.
- Show upload progress, success, and actionable error feedback.
- Present attached files clearly, with understandable preview, download, rename, and remove actions.
- Preserve accessibility, keyboard operation, mobile usability, and existing retention/security rules.

## Publication deletion, retention, and visibility

Deleting a publication must remain a soft-delete operation: the record stays in the database for administrative traceability, but it must never remain visible to parent users.

The backend currently enforces this distinction: parent lists and direct parent detail lookups require both `visibility = 'visible'` and `deletedAt IS NULL`, while the administrator list includes every state. Future work must preserve and make this behavior obvious:

- Parent users must not see deleted publications in lists, search results, category totals, direct URLs, or attachment access.
- The administration area must continue showing retained deleted publications with an unmistakable **Deleted** status badge or dedicated filter/view.
- Hidden and deleted states must look different and explain their effect.
- Destructive actions must clearly state that deletion removes public access but retains the database record.
- Restoration or permanent deletion must not be added implicitly; each requires a separate product decision and authorization.
- Regression tests must cover parent list access, guessed direct URLs, attachments, and administrator visibility after deletion.

## Future exploration

Before implementation:

1. Audit the administrator and parent-facing Academy screens at desktop and mobile sizes.
2. Inventory every action and classify it as primary, secondary, destructive, or navigation.
3. Trace the existing attachment lifecycle and decide between post-creation upload guidance or staged pre-save uploads.
4. Verify the complete soft-delete boundary, including direct publication and attachment access.
5. Define a small reusable Academy visual system based on the existing TEW identity; do not introduce a separate unrelated style.
6. Agree on acceptance criteria and implement with focused regression tests.

## Non-goals for this session

- No source code, styles, routes, APIs, or production deployment are changed.
- No attachment behavior is removed or replaced.
- No visual redesign decisions are considered final until the future audit is completed.
