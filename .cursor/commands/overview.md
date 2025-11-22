### Prompt for Cursor

You are auditing the changes you (this assistant) made. Produce a comprehensive, well-explained handover another model can review and continue seamlessly. Include all relevant details to understand what changed, why, and how to proceed next.

### Scope
- Inspect workspace edit history and git if available.
- Include all files changed since the last commit (or session start if broader).
- Capture code, schema, configuration, tests, and docs changes.

### Output (Markdown, detailed)
- **Title**: Handover: Detailed Change Overview

1. **Executive Summary**
   - 2–5 sentences of what changed, why, and expected impact.

2. **Commit Range and Workspace State**
   - Commit range (e.g., `<base>..<head>`) or “uncommitted changes”.
   - Current branch and divergence from remote.

3. **Context and Objectives**
   - Problem statement and constraints.
   - Goals and non-goals; acceptance criteria if applicable.

4. **Changes by Area**
   - Application/UI
   - API/Route Handlers/Server Actions
   - Edge Functions/Workers
   - Database/Migrations/RLS/Functions
   - Infrastructure/Config/Env/Feature Flags

5. **Changes by File**
   - Format per item: `<path>` — {add|edit|delete}; key symbols/functions/classes; concise rationale.
   - Group related files and call out significant refactors.

6. **Behavioral Changes and UX**
   - User-visible behavior, edge cases, loading/empty/error states.
   - Accessibility and performance considerations.

7. **API and Contracts**
   - Endpoints, inputs/outputs, status codes, error shapes.
   - Backwards compatibility and deprecations.

8. **Database and Migrations**
   - Schema changes (tables, columns, indexes, constraints).
   - RLS policies per operation (select/insert/update/delete) and roles.
   - Functions/triggers; security posture (invoker/definer), search_path.
   - Types regeneration steps if applicable.

9. **Security and Privacy**
   - Secrets handling, auth/RLS posture, PII handling, logging redactions.

10. **Logging and Observability**
   - New/updated log tags and context; noisy logs removed.
   - Metrics/traces if applicable.

11. **Performance and Scalability**
   - Hot paths, batching, retries/backoff, caching, pagination.

12. **Risks and Backwards Compatibility**
   - Breaking changes, migration risks, data integrity, roll-forward/rollback notes.

13. **Testing and Verification**
   - Unit tests added/updated; coverage of critical logic.
   - E2E scenarios added/updated; idempotency and guards.
   - How to run: quick, critical, and full suites; expected green checks.

14. **Deployment and Rollback Plan**
   - Order of operations, required env/config, feature flags.
   - Safe rollback steps and data restoration if needed.

15. **Follow-ups and Open Questions**
   - TODOs, deferred items, and decisions needed (clear owners if known).

16. **Appendix: Reproduction and Commands**
   - Local run/build/test commands; DB query helpers; types generation.
   - Git and diff commands for verification.

17. **Human-Readable Overview Summary**
   - Short narrative (1–2 short paragraphs) summarizing what changed, why it matters, and how to proceed next.

### Constraints
- Derive only from actual diffs/history; no speculation.
- Include commit range or note “uncommitted changes”.
- If something is unknown, write “N/A”.

### Helpful commands
```bash
# Git state and diffs
git status
git branch --show-current
git rev-list --left-right --count origin/$(git branch --show-current)...HEAD
git log --oneline --no-decorate -n 20
git diff --name-only HEAD
git diff --stat HEAD

# Tests
npm test:quick || npm test:unit
npm test:critical
npm test:all

# E2E
npm e2e
npm e2e:report

# Supabase types (replace project ref if needed)
supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/types/db/db.ts

# DB ad-hoc queries
npm db:query "SELECT now();"
```