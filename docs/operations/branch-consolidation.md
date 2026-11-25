# Branch consolidation runbook

`main` is the only long-lived branch. Every other branch exists to land a change
through review; once that change is in `main` — usually under a different commit
shape, because most of them were squashed — the branch is dead weight that makes
`git branch -a` unreadable and invites someone to merge an obsolete file back
into the deployed tree.

## Method

`node scripts/audit-branches.mjs` answers two questions per `origin/*` branch,
with evidence instead of intuition:

1. **Would merging it change anything?** `git merge-tree --write-tree HEAD <branch>`
   produces the merged tree; if it is byte-identical to `HEAD`'s tree the branch
   is already fully contained. Reported as `noop`.
2. **How much of its unique work is already in `HEAD`?** Every added line in
   `merge-base..branch` (filtered for length and imports) is looked up in the
   same path in `HEAD`. A change that was rewritten into a different shape still
   counts as present because the line survives somewhere in the file.

A branch is disposable when it is `noop`, when its ratio is `1.00`, or when the
commits it holds are ancestors of `main`. Anything else needs a human read of the
listed misses — the audit prints them.

## Audit — 2026-11-25

44 remote branches, `main` at `01a5a7d`.

| Group | Count | Why it is contained |
| --- | --- | --- |
| Commits are ancestors of `main` | 9 | `git rev-list --count HEAD..branch` is 0 — literally already merged |
| Merge produces an identical tree | 13 | `noop` from `merge-tree`; merging changes no file |
| Unique lines already in `main` (0.69–1.00) | 18 | Present verbatim in the evolved file |
| **Needs a decision** | 3 | See below — these hold content `main` does not, and merging it would be wrong |

Spot-checks for the mid-ratio branches, because a ratio alone is not proof:

- `fix/secure-owner-bootstrap-principal-gate` (0.88) — the old `ownerPrincipal :
  ?Principal` constant became `ownerPrincipalText : ?Text` with principal
  parsing and rejection of unparsable input in `src/backend/lib/admin.mo`. Same
  guarantee, stricter check.
- `security/disable-uncontrolled-generic-admin` (0.76) — the migration it added
  is `src/backend/migrations/20261029_150000.mo`, which is present in `main` and
  still sets `adminAssigned`.
- `feat/independent-product-image-urls-2026-10-29` (0.69) — `src/backend/lib/content.mo`
  now validates every URL field with `field # " must use HTTPS"`, and
  `src/frontend/src/lib/productImageUrl.ts` exists.
- `feature/participant-portal-integration` (0.88) — `/participants/submit` is a
  real route rendering `SubmitProject`, whose intake is live; the branch predates
  the intake service and its placeholder copy is gone on purpose.
- `fix/vercel-spa-routing-and-backend-gate` (0.09) — `src/frontend/vercel.json`
  already exists and its rewrite is stricter: it excludes `assets/`,
  `favicon.ico`, `robots.txt`, `sitemap.xml` and `env.json` from the SPA
  fallback, which the branch's `(.*)` → `/index.html` version does not.

## Branches kept for a decision

| Branch | What it contains | Why it is not merged |
| --- | --- | --- |
| `config/set-caffeine-project-id` | One line: sets `project_id` in the tracked `src/frontend/env.json` to a Caffeine project UUID | This deployment runs in static mode with no Caffeine project; `dist/env.json` is generated at build time, and setting a project id would switch on Caffeine infrastructure nothing here uses |
| `infra/independent-backend-preflight` | A second backend workflow (`.github/workflows/motoko-backend-quality.yml`), `docs/independent-vercel-backend.md`, an extra `mops.toml` entry | It watches `.old/src/backend/**` paths that no longer exist and duplicates `backend-quality.yml`, which already runs the Mops build, migration check and contract-parity test |
| `docs/revalidate-production-readiness-2026-10-29` | An audit addendum for the state at PR #23 | `docs/poka-yoke/audit-2026-10-29.md` has since been superseded by later audits; adding the older addendum back would present a stale release statement as current |

## Removing the dead branches

This workspace has no credential for ref deletion (`git push --delete` fails with
`could not read Username for 'https://github.com'`), so the branches are listed
here rather than removed. Run this from a clone with push access after the gate
set is green:

```bash
node scripts/audit-branches.mjs            # re-confirm nothing is unique first
```

Then remove the branches the audit prints as `noop` or `1.00` (18 of them, listed
here so the command is copy-pasteable; the audit is still the authority):

```bash
git push origin --delete \
  appjet \
  backend/verify-generated-artifact-parity-2026-10-29 \
  docs/final-production-reaudit-2026-10-29 \
  docs/update-release-evidence-after-pr-28 \
  fix/native-ignore-legacy-storage-images-2026-10-29 \
  fix/portal-assessment-sbom-hash \
  fix/portal-production-static-assets \
  fix/portal-readiness-health-gate-2026-10-29 \
  fix/public-oql-expose-published-only \
  fix/rebuild-safe-backend-artifacts-after-owner-tests \
  fix/validate-site-cta-hrefs \
  fix/vercel-spa-deep-links \
  hardening/availability-and-integrity-2026-11-25 \
  security/close-first-caller-access-control-2026-10-29 \
  test/backend-image-url-validation-2026-10-29 \
  test/backend-owner-immutability-2026-10-29 \
  test/owner-bootstrap-negative-path-regressions
```

The remaining 18 branches sit at ratios between 0.69 and 0.99. Read the misses
the audit prints for each one before deleting it: when every miss is a line
`main` rewrote (for example `useInternetIdentity()` becoming `useIdentity()` under
the backend capability gate), the branch is history and can go; the three
decision branches and `freebuff/*` (the active working branch) stay regardless.

## Keeping it clean

Run the audit before a release, not after a surprise. A branch that prints a
ratio below `1.00` and a merge outcome of `changes` is the only kind worth
opening; everything else is history that `main` already contains.
