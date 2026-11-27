# Backup and retention runbook

This runbook covers every stateful store in the project. Nothing here is
automated from this repository: there are no production credentials, no scheduler
and no managed database in CI. Each section states what the owner must configure,
how a restore is proven, and what the acceptable loss window is.

Review it before every release that changes a schema, and rehearse the restore
drills at least quarterly.

## Stores and ownership

| Store | Contents | Backup mechanism | Owner action required |
| --- | --- | --- | --- |
| Portal MySQL (`DATABASE_URL`) | Users, sessions, submissions, rubric versions, validation results, evaluations, decisions, withdrawals, automated assessment runs, terms versions, and the hash-chained `portal_audit_events` | Managed provider snapshots **plus** logical `mysqldump` exports | Provision managed MySQL with automated backups and point-in-time recovery; store dump destination credentials as secrets |
| Object storage (presigned S3-compatible, reached through `MANUS_API_URL`) | Uploaded participant artefacts referenced by `/manus-storage/<key>` | Provider versioning + lifecycle policy | Enable bucket versioning, object lock if available, and a deletion-protection policy |
| Motoko backend canister | All published and draft content (products, FAQs, site copy) plus admins and submissions policy in stable memory | Stable-memory snapshot on upgrade + periodic export through the admin query surface | Fund the canister, configure the owner principal, and rehearse an upgrade |
| Frontend build artefact | Static bundle and publicly injected `env.json` | Git tag + immutable deploy artefact | Keep the deploy artefact for every released tag; never rebuild an old release from a moving branch |
| Secrets | JWT signing key, OAuth credentials, DB URL, metrics token, webhook URL, `INTAKE_ADMIN_TOKEN` | Secret store only | Rotate on a schedule and after any suspected exposure; never back them up to the repository |
| Intake submissions | Contact, waitlist and participant records in D1 plus attachments in R2 | Provider-managed durability; export on demand | Erasure and retention purge are implemented (see below); the export is `node services/intake/scripts/export-submissions.mjs` |

## Portal MySQL

### Schedule

| Backup | Frequency | Retention | Location |
| --- | --- | --- | --- |
| Provider automated snapshot | Daily (provider minimum) | 30 days | Provider-managed, cross-region if offered |
| Point-in-time recovery log | Continuous | 7 days minimum | Provider-managed |
| Logical `mysqldump --single-transaction --routines --triggers` | Daily | 90 days | Encrypted object storage in a different account or region |
| Quarterly restore drill export | Quarterly | 1 year | Encrypted archive, access-logged |

### Logical dump

Run against a read replica or during a low-traffic window. The portal writes an
append-only hash chain in `portal_audit_events`, so a restore must not silently
rewrite or drop those rows.

```bash
umask 077
: "${DATABASE_URL:?set DATABASE_URL}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mysqldump --single-transaction --quick --routines --triggers \
  --set-gtid-purged=OFF --default-character-set=utf8mb4 \
  --no-tablespaces "$DATABASE_URL" | gzip -9 > "portal-${stamp}.sql.gz"
sha256sum "portal-${stamp}.sql.gz" > "portal-${stamp}.sql.gz.sha256"
```

Upload both files to the backup bucket, then delete the local copies. Verify the
checksum **after** upload and record the resulting object key in the release log.

### Restore drill (never against production)

1. Provision a disposable MySQL 8 instance.
2. `sha256sum -c portal-<stamp>.sql.gz.sha256`.
3. `gunzip -c portal-<stamp>.sql.gz | mysql --default-character-set=utf8mb4 <target>`.
4. Run `pnpm --dir apps/participant-portal db:migrate` and confirm it reports no
   pending migrations. A dump that still needs a migration means the release
   notes and the migration chain drifted.
5. Start the portal against the restored database with a **test**
   `MANUS_JWT_SECRET`, then call `/api/health/ready`. It must return `200` and
   `{"status":"ready"}`; every required table is probed.
6. Spot-check counts:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM submissions;
   SELECT COUNT(*) FROM portal_audit_events;
   ```
   Compare with the counts recorded when the dump was taken.
7. Verify audit-chain continuity by reading the most recent events through the
   admin surface; a restore that breaks the chain is a failed drill.
8. Destroy the instance and record the drill result, duration and any anomaly.

**RPO/RTO targets to confirm with the owner:** RPO ≤ 15 minutes (point-in-time
recovery), RTO ≤ 4 hours (restore plus readiness verification). These are targets,
not measured guarantees, until a drill has been timed.

### Retention decisions still open

- How long withdrawn submissions and their evidence must be retained.
- Whether applicant data must be deleted on request, and how that interacts with
  the append-only audit chain (the chain records the event; the payload must be
  purgeable).
- Legal hold requirements for decisions and evaluations.

Until the owner records these, treat all portal data as retained indefinitely and
**do not** enable an automated purge job.

## Object storage

Participant artefacts are written through a presigned URL from the Forge/Manus
storage provider and served back through `/manus-storage/<key>`.

Required provider configuration:

1. Bucket versioning **on**, with a lifecycle rule that expires non-current
   versions after 90 days.
2. Block public access; all reads go through the signed proxy.
3. Server-side encryption with a customer-managed key if the provider supports it.
4. A cross-region replication target, or a documented provider durability
   guarantee if replication is not available.
5. Object-lock or a deletion-protection policy so a compromised key cannot erase
   evidence in one request.

Deletion of a participant's artefacts must be an explicit, audited operation:
remove the object *and* record the deletion in the portal audit chain. A backup
copy surviving in a non-current version is expected and must be documented in the
privacy notice.

## Motoko backend canister

Content lives in stable memory. There is no automatic off-chain backup; the
durable copies are the upgrade snapshot and an intentional export.

### Before every upgrade

```bash
# From the repository root, with the pinned Mops toolchain installed.
mops check backend
node scripts/generate-backend-sbom.mjs --check
# 1. Record the current module hash and cycle balance.
icp canister status backend
# 2. Snapshot stable memory to a local file.
icp canister snapshot create backend --name "pre-upgrade-$(date -u +%Y%m%dT%H%M%SZ)"
# 3. Export the snapshot off the controller machine.
icp canister snapshot download backend <snapshot-id> --output backend-<stamp>.snap
sha256sum backend-<stamp>.snap > backend-<stamp>.snap.sha256
# 4. Deploy the new Wasm.
icp deploy backend
# 5. Verify the public contract survived.
icp canister call backend listPublishedProducts '()'
icp canister call backend listPublishedFaqs '(10 : nat)'
icp canister call backend getSiteContent '()'
icp canister call backend isOwnerClaimed '()'
```

The migration chain must contain exactly one pending migration; the backend
quality workflow enforces this with `scripts/check-backend-migrations.mjs`.

### Rollback

1. Stop traffic to the frontend (or point `backend_canister_id` at the previous
   canister if one is still funded).
2. Restore the pre-upgrade snapshot, then reinstall the previous Wasm from the
   release tag.
3. Re-run the public-contract checks above.
4. Record the incident and the restored snapshot id.

**Cycle balance is availability.** An out-of-cycles canister is a full outage and
cannot be fixed by a backup. Monitor the balance, top up ahead of a threshold, and
keep the controller keys in the same custody model as production secrets.

### Export policy

Export published content (products, FAQs, site copy) monthly through the admin
surface and store it with the same encryption and retention as the MySQL dumps.
This is the only recovery path for content if the canister is lost entirely.

## Frontend release artefacts

- Tag every production release; the tag plus `pnpm-lock.yaml` is the reproducible
  build input.
- Keep the built bundle and the exact `env.json` served in that release. The
  runtime configuration is part of the artefact, not of the repository.
- Retain release artefacts for at least one year, and longer for any release
  referenced in a legal or audit context.
- Never re-deploy an old tag with a rebuilt `env.json` unless the change is
  recorded: a canister id change silently re-points the site.

## Intake submissions and attachments

Participant submissions may carry up to three files (a zip, a tarball, a PDF or
a source file). They are retained exactly as long as the submission they belong
to: deleting the submission means deleting its `intake_file` rows and the R2
objects named by them. Nothing else indexes those objects, so an orphaned row is
the only way to reach a file.

Both operations below are implemented and tested; neither is scheduled, because
scheduling them needs the operator token and a decision about the window.

### Erasure on request

The published privacy notice promises deletion on request. Run:

```bash
node services/intake/scripts/delete-submission.mjs <reference> --yes \
  --token-file ~/.config/ovanite/intake-admin-token
```

The Worker removes the R2 objects, then the file rows and the record in one D1
batch, and logs an `intake_submission_deleted` line with the reference and the
attachment count. A failed object deletion aborts the whole call, leaving the
record intact for a retry. Record the reference, the date and who asked in the
release log: that line is the audit trail.

### Retention purge

The notice states a maximum of 12 months after review. The purge is dry by
default:

```bash
# Report what is due (no deletion).
node services/intake/scripts/delete-submission.mjs --older-than-days 365 \
  --token-file ~/.config/ovanite/intake-admin-token

# Delete the reported set.
node services/intake/scripts/delete-submission.mjs --older-than-days 365 --yes \
  --token-file ~/.config/ovanite/intake-admin-token
```

Run it quarterly or monthly, keep the printed output as the deletion log, and
remember that a cloud provider's own backups may retain a copy for their
snapshot window — say so in the notice if that becomes material.

### Never publish the preview environment

The intake service's preview environment has its own database and bucket and no
operator token. A published preview therefore accepts real visitor data that
nobody can read. Production is the only environment that should be published;
unpublishing leaves the data, secrets and URL in place.

## Secret rotation and retention

- Rotate `MANUS_JWT_SECRET` on a schedule and immediately after suspected
  exposure. Rotation invalidates every session; announce it.
- Rotate `METRICS_TOKEN`, `ERROR_WEBHOOK_URL` credentials, `MANUS_API_KEY`,
  `OVANITE_GITHUB_ACTIONS_TOKEN` and `OVANITE_ASSESSMENT_CALLBACK_SECRET` on the
  same schedule.
- Never store secrets in the repository, in `env.json`, in SBOMs, in CI logs or in
  backup filenames. SBOM generation reads only dependency metadata.
- Audit access to the secret store quarterly.

## What is deliberately not automated here

- No cron, scheduled workflow or cron container performs backups: doing that
  safely needs production credentials and a destination, both owner-supplied.
- No retention job runs on a schedule. The purge exists and is tested, but
  running it needs the operator token and a reviewed decision, so it is invoked
  by hand and its output is the audit trail.
- No restore has been performed against production data, because there is no
  production deployment yet.
