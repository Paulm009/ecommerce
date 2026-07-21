---
name: quality-review
description: 'Review Laravel and Inertia changes for correctness, authorization, data integrity, concurrency, performance, design consistency, accessibility and tests. Use when asked to review code, a diff, a pull request, a completed feature or a bug fix.'
---

# Quality review

1. Read the requirement and current diff.
2. Trace the request from route to database and React output.
3. Verify permission and validation at the server boundary.
4. Review state transitions, transactions, constraints and idempotency.
5. Compare visible changes with `DESIGN.md`.
6. Check tests against the most important failure modes.
7. Run non-destructive checks when they confirm a finding.
8. Report only actionable findings, ordered by severity.

Do not edit files. Do not report formatter preferences as defects.
