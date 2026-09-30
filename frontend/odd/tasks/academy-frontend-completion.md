# Academy frontend completion

Authorized scope: `frontend/**` only. No backend, lockfile, OpenSpec, Git mutation, deployment, installation, secrets, or real data.

- [x] Restore user mutation baseline: confirmed reset, cancellation without request, per-account pending/serialization, ephemeral account-bound password. Evidence: `node --test ... admin-users.test.ts` — 7/7 pass. Commit intentionally omitted because Git mutation is forbidden.
- [x] Wire latest-request protection into the administrative post list. Evidence: stale success/error/loading writes are generation-gated; targeted suite 3/3 passes. Commit intentionally omitted because Git mutation is forbidden.
- [x] Complete editor and attachment error/retry/reflow behavior, including async category selection, method-level post serialization, attachment write serialization, upload feedback, native input reset only after success, and preserved responsive styles. Evidence: editor suite RED 5/8 then GREEN 8/8; parent browser re-check remains required. Commit intentionally omitted because Git mutation is forbidden.
- [x] Harden Academy HTTP contracts: authorized same/cross-origin 401 handling without widening Bearer scope, 429 Retry-After feedback, es-ES browser-local presentation, structured error consumption, and distinct summary/detail response types. Evidence: focused suites 14/14 and changed-file LSP reports no errors (some clean checks are push-only/inconclusive). Commit intentionally omitted because Git mutation is forbidden.
- [x] Port the existing ROOT public accessibility improvements without replacing Home wholesale: progressive AOS fallback, keyboard menu, skip links, focused 404, mailto links, route metadata, reduced motion, and explicit Maps activation. Evidence: public suite 20/20 and no LSP errors reported (most clean checks are push-only/inconclusive). Commit intentionally omitted because Git mutation is forbidden.
- [x] Run all discovered frontend tests, build, diagnostics, and adversarial checks. Evidence: 16/16 test files discovered; 67/67 checks pass; `ng build` passes; `git diff --check -- frontend` passes; changed-path LSP reports zero errors but 12/15 clean checks are push-only/inconclusive. Native review stopped at intended-untracked selection because the ambient candidate also contains concurrent backend/out-of-scope changes and the user forbids launching agents. Browser/API E2E remains with the parent. Commit intentionally omitted because Git mutation is forbidden.

## Independent review correction round 1

- [x] Preserve every concurrent create/reset secret in an in-memory queue until explicit per-secret acknowledgement.
- [x] Use one shared mutation gate for all post and material writes, with mutually disabled mutating controls.
- [x] Align the runtime/type error-code contract exactly with the 21 backend codes.
- [x] Prevent 320/375 px hero and Academy card text clipping without redesign.

Evidence: adversarial helper suites pass; full automatic frontend suite 71/71; `git diff --check -- frontend` passes; changed-path LSP reports zero errors with push-only clean limitations. Build intentionally omitted because the parent reserved it.

Evidence is recorded after each completed task. Browser E2E remains owned by the parent and must not be inferred from static/unit checks.
