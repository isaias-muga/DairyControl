# Architecture review

A written, repeatable review of `main` against the rules in `CLAUDE.md`. The goal is to find drift before it becomes
a bug: rules that exist only as prose get broken, so every recurring class of finding ends as an architecture test
or a rule in `CLAUDE.md`.

## When to run it

- Every 5 merged PRs.
- Before any freeze or release.
- After an incident or a bug that escaped to `main` (see "How to work in this repo" in `CLAUDE.md`).

## How to run it

1. Start a **fresh subagent** that has not seen the recent work (no implementation conversation). Give it only:
   this checklist, `CLAUDE.md`, the previous review in `docs/reviews/`, and read access to `main`
   (`git switch main && git pull` first).
2. Ask it to go through the checklist below, read the code (not only the docs), and report findings **ranked by
   severity** (High: wrong data, security, silent failures; Medium: rule drift, missing tests; Low: tidy-ups), each
   with a file and line and a concrete failing scenario.
3. Review its list yourself: drop what is wrong, merge duplicates.
4. Propose one issue per finding (or per group of related findings) to the developer. Do not open issues without
   approval.
5. For every finding that is a **class** of error (it could happen again somewhere else), add an architecture test in
   `tests/DairyControl.ArchitectureTests` or a rule in `CLAUDE.md`, in the PR that fixes it.
6. Record the review in `docs/reviews/<yyyy-mm-dd>.md` (template at the end) in the same PR as the first fix, or on
   its own if nothing is fixed yet.

## Checklist

1. **Layer dependencies and aggregate size**
   - Domain references only the BCL; Application only Domain; Infrastructure not Api; controllers talk to
     application services only (the architecture tests cover this: confirm they still run and still scan something).
   - Aggregates stay small: does a use case load a whole aggregate (e.g. every recepción of a proveedor) to change
     one child? Is anything outside the aggregate root modified directly?
2. **Duplicated business rules**
   - Each rule lives in one place (the domain). Search Application, Api, the client and SQL/EF expressions for copies of
     thresholds or conditions (quality limits, plausible ranges, "out of range", ticket uniqueness).
   - Client limits in `models/limits.ts` still mirror the domain constants.
3. **Unlogged errors**
   - Every unexpected exception is logged with its trace id; no `catch` swallows an exception; no empty `catch`.
   - Background work and startup tasks (migrations, demo data) log failures.
   - Logs never contain bodies, passwords or tokens.
4. **Security**
   - Anonymous endpoints are only `/health` and `AuthController`; every other controller has `[Authorize]`.
   - Secrets only in User Secrets / environment variables; compared with `CryptographicOperations.FixedTimeEquals`.
   - Dependency advisories (`dotnet list package --vulnerable --include-transitive`, `npm audit`); CORS origins;
     input validation at the API boundary; error messages that leak internals.
5. **Performance with growing data**
   - Queries that load whole tables or collections, missing indexes for the filters in use, N+1 loads, unbounded
     lists (pages are capped), large payloads. Think of the data after a year of reception tickets.
6. **Tests in the right project**
   - Domain tests use real objects; Application tests mock repositories and never touch a database; only
     Infrastructure tests use (in-memory SQLite) databases; Application.Tests does not reference Infrastructure.
   - New behavior has a test; every bug fixed since the last review has a regression test.
7. **`CLAUDE.md` drift**
   - Folder lists, conventions and commands match the repository (client pages/components, test projects, flags in
     `compose.yaml`, endpoints). Rules that the code no longer follows are either fixed in code or removed from the file.
8. **Open findings from the previous review**
   - For each finding of the previous entry in `docs/reviews/`: still open, fixed (with the PR) or dropped (why).

## Review entry template (`docs/reviews/<yyyy-mm-dd>.md`)

```markdown
# Architecture review <yyyy-mm-dd>

- Scope: `main` at <commit>, <n> PRs merged since the previous review.
- Run by: <who>, fresh subagent: <yes/no>.

## Findings

| # | Severity | Finding | Where | Outcome |
|---|----------|---------|-------|---------|
| 1 | High | ... | `path:line` | Issue #n / fixed in PR #n / dropped (reason) |

## New rules and tests

- <architecture test or CLAUDE.md rule added because of a recurring class of finding>

## Next review

- Due after PR #<n> or before <release>.
```
