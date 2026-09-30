# Backend Academy completion

Scope: backend only. Preserve prior changes; no dependency, lockfile, OpenSpec, real data, deployment, or Git mutation.

- [x] 1. Restore the CLI test baseline without weakening the 10-character password policy. Evidence: CLI suite 5/5 PASS.
- [x] 2. Reject incompatible Academy v0/v1 schemas without changing schema, rows, or user_version; preserve unrelated legacy tables. Evidence: migration suite 9/9 PASS.
- [x] 3. Apply the shared 10-character minimum to own-password changes and structure admin-user errors. Evidence: route suite 14/14 PASS before the abort regression was added.
- [x] 4. Prove aborted authenticated HTTP requests close SQLite exactly once; make finish/close cleanup idempotent. Evidence: focused real-HTTP abort test PASS.
- [x] 5. Add sanitized request correlation/error logging without request bodies, authorization, PII, secrets, or storage paths. Evidence: induced SQLite error emits only event/requestId/errorCode and returns matching X-Request-Id.
- [x] 6. Prove test-glob discovery in a temporary copy and run complete HTTP/SQLite/upload regressions plus isolated build. Evidence: injected suite failed with `GLOB_PROOF_CAPTURED`; official suite 58/58 PASS; isolated TypeScript build emitted 42 files; `git diff --check -- backend` PASS.

All batches completed. No commit was created because Git mutation is explicitly prohibited for this work unit.
