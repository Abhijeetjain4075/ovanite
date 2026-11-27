# Ovanite intake service

One small HTTP service for every public intake surface on the site: contact,
waitlist and participant submission. It exists because the public frontend has no
server of its own — a static deployment cannot store a submission.

## Contract

`POST /api/intake` with `content-type: application/json`, or
`multipart/form-data` when files are attached: the same JSON travels in a
`payload` field and each file is a `files` part.

| Field | `contact` | `waitlist` | `participant` | Notes |
| --- | --- | --- | --- | --- |
| `kind` | required | required | required | `contact` \| `waitlist` \| `participant` |
| `name` | required | required | required | ≤ 120 chars |
| `email` | required | required | required | ≤ 254 chars, syntax checked |
| `message` | required | — | required | ≥ 10, ≤ 4000 chars (project description for participants) |
| `note` | — | optional | — | ≤ 500 chars |
| `project` | — | — | required | ≤ 120 chars |
| `stack` | — | — | optional | ≤ 300 chars |
| `repository` | — | — | optional | HTTPS URL only |
| `status` | — | — | optional | ≤ 60 chars |
| `website` | — | — | — | Honeypot. Any value is accepted and discarded. |
| `files` | — | — | optional | Multipart file parts: up to 3, 20 MB each, 25 MB total |

Responses:

| Status | Body | Meaning |
| --- | --- | --- |
| `201` | `{ok, status:"received", reference}` | Stored durably; safe to show a success page |
| `200` | `{ok, status:"duplicate", reference}` | An identical submission already exists |
| `400` | `{ok:false, error:"invalid", fields}` | Field-level validation failure |
| `403` | `{ok:false, error:"origin_not_allowed"}` | Browser origin not in the allowlist; the refusal carries `access-control-allow-origin` for the refused origin so the page can read this code instead of seeing an opaque network failure |
| `413` / `415` | `{ok:false, error}` | Payload too large / not JSON |
| `429` | `{ok:false, error:"rate_limited"}` + `retry-after` | 5 per hour and 20 per day per client |
| `500` / `503` | `{ok:false, error:"unavailable"}` | Generic failure; never a stack or SQL fragment |

### Attachments

The participant form accepts files so a visitor can send a repository zip, a
tarball, a PDF or a single source file.

| Rule | Value |
| --- | --- |
| Files per submission | 3 |
| Size per file | 20 MB |
| Total per submission | 25 MB |
| Archives | `.zip`, `.tar.gz`, `.tgz`, `.gz`, `.7z`, `.rar` |
| Documents | `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.md`, `.txt`, `.csv` |
| Source files | `.ts`, `.tsx`, `.js`, `.py`, `.go`, `.rs`, `.java`, `.sql`, `.json`, `.yaml`, `.sh`, and the rest of the list in `src/files.js` |

An archive must carry its signature (`PK\x03\x04` for zip, `1f 8b` for gzip) and
a text file must contain no NUL bytes, so renaming an executable to `.zip` is
refused. The service never unpacks, executes or serves an upload inline: bytes go
to the R2 binding `FILES` under a generated key (`intake/<year>/<month>/<uuid>.<ext>`)
and the original name is kept only as metadata. A rejected or failed submission
leaves no object behind.

`GET /healthz` returns `{ok:true}` once the database answers.

`GET /api/files?submission=<reference>` lists a submission's attachments and
`GET /api/files/<id>` streams one as a download. Both require the same bearer
token as the operator read path, both are absent without `INTAKE_ADMIN_TOKEN`,
and nothing about an attachment is reachable from the public site.

`GET /api/intake?limit=50` is the operator read path. It does not exist unless
`INTAKE_ADMIN_TOKEN` is set to at least 32 characters, and it requires
`Authorization: Bearer <token>`. It never returns the stored IP digest.

## Where a submission goes, and how to get it

A submission is stored in two places, both owned by this service:

| Part | Location |
| --- | --- |
| The record (name, email, message, project, stack, repository, status, origin, timestamps, reference) | D1 binding `DB`, table `intake` |
| Attachments (up to 3, 25 MB total) | R2 binding `FILES`, key `intake/<year>/<month>/<uuid>.<ext>`, indexed by table `intake_file` |

The public site never reads either. Both are reachable only with
`INTAKE_ADMIN_TOKEN`, which is why that token is required for an operator to see
anything at all.

### See what arrived (no download)

```bash
node services/intake/scripts/export-submissions.mjs --list \
  --token-file ~/.config/ovanite/intake-admin-token
```

Prints one row per submission — reference, received time, kind, name, email,
project — newest first. Nothing is written to disk.

### Download everything

```bash
node services/intake/scripts/export-submissions.mjs \
  --token-file ~/.config/ovanite/intake-admin-token \
  --out ./intake-export
```

That writes:

```
intake-export/
  submissions.json                     every stored record, newest first
  attachments/<reference>/<name>       the files exactly as sent
```

### Extract the archives

```bash
node services/intake/scripts/export-submissions.mjs --extract \
  --token-file ~/.config/ovanite/intake-admin-token --out ./intake-export
```

Adds `attachments/<reference>/extracted/<archive>/…` for `.zip`, `.tar.gz`,
`.tgz` and `.gz`. Extraction is treated as hostile input: an entry that would
escape its folder is refused, links are never followed, encryption is refused
rather than guessed at, and the entry count and sizes are capped (2,000 files,
64 MB each, 256 MB total). A file that cannot be extracted leaves the original
untouched and is reported next to it, so one odd attachment never aborts an
export. The originals are always kept.

### Share one submission with a reviewer

```bash
node services/intake/scripts/export-submissions.mjs --bundle \
  --token-file ~/.config/ovanite/intake-admin-token --out ./intake-export
```

Writes `intake-export/share/<reference>.zip` for every submission: the record as
`submission.json` plus `attachments/<name>`. It is a plain zip any machine opens,
it contains no token, and it is the only thing you should ever send to another
person. Send it over a channel you already trust, and delete it afterwards.

**There is deliberately no share link.** A URL that serves a submission would be
a second read path for personal data — exactly what the rest of this service is
built to avoid — so sharing means handing over a file you control, not publishing
an endpoint. If you ever need time-limited reviewer access, build it as a
separate authenticated surface with an expiry and an audit trail; do not widen
this one.

Every file is written `0600` inside a `0700` folder because submissions are
personal data; `intake-export/` is ignored by git. A stored attachment name is
reduced to a single path segment, so a crafted name cannot escape the export
folder.

Remove the export when you are done with it, and follow
[`docs/operations/backup-and-retention.md`](../../docs/operations/backup-and-retention.md)
for deletion and retention.

### Retrieve a single item without the script

```bash
curl -sS https://ovanite-intake-gn5iks.freebuff.site/api/intake?limit=50 \
  -H "Authorization: Bearer $INTAKE_ADMIN_TOKEN"

curl -sS "https://ovanite-intake-gn5iks.freebuff.site/api/files?submission=<reference>" \
  -H "Authorization: Bearer $INTAKE_ADMIN_TOKEN"

curl -sS "https://ovanite-intake-gn5iks.freebuff.site/api/files/<file-id>" \
  -H "Authorization: Bearer $INTAKE_ADMIN_TOKEN" -o attachment.zip
```

### If the site says it could not reach the service

The visitor message has three distinct causes, and the service distinguishes them:

| What the visitor sees | What happened |
| --- | --- |
| "We could not reach the submission service" | The browser could not complete the request: offline, DNS/TLS failure, or a blocked fetch. Nothing was stored. |
| "This website address is not authorised to send submissions" | The page's origin is not in `ALLOWED_ORIGINS`. A Vercel preview or custom domain must be added there explicitly; the canonical site is `https://ovanite.vercel.app`. Nothing was stored. |
| "The submission service took too long to answer" | The request exceeded its budget (20 s for a record, 180 s for one carrying files). Nothing was stored. |

`GET /healthz`, an `OPTIONS` preflight from the canonical origin, and a
`curl -X POST` to `/api/intake` are the three checks that separate a site problem
from a service problem.

### Adding a deployment origin

`ALLOWED_ORIGINS` is an exact allowlist, never a wildcard: an entry is a scheme
and host with no path. Add the origin (for example a Vercel preview host) as a
comma-separated value on the service, redeploy, then submit from that origin. A
refused origin gets a readable 403, so the failure is diagnosable rather than a
silent timeout.

## Security model

A submission is personal data. The design rule is therefore that **no anonymous
request can ever read stored data**, and that the operator path is the only one.

| Surface | Anonymous | Operator (bearer token) |
| --- | --- | --- |
| `POST /api/intake` | create only; the response is a reference and attachment names | — |
| `GET /api/intake` | `401` (or `404` when no token is configured) | record list, never the IP digest |
| `GET /api/files?submission=` | `401` | attachment metadata |
| `GET /api/files/<id>` | `401` | the bytes, as a download |
| `DELETE /api/intake/<reference>` | `401` | erasure of the record and its objects |
| anything else, including `/` and `/env.json` | `404` | `404` |

How those rules are enforced:

- **The token is compared in constant time.** Both sides are hashed and every
  byte is combined, so response timing cannot reveal a prefix of the token.
- **Guessing is rate-limited.** Ten failed operator attempts per client per hour
  return `429` with `retry-after`; the counter is keyed by the same salted
  address digest as the intake limit, never by the address itself. The limit is
  per client address and applies to correct tokens too, so an address that has
  already failed ten times waits out the hour (or uses another network). That is
  deliberate: a check that ran before the counter would give every guess one
  comparison.
- **A missing token hides the routes.** With no `INTAKE_ADMIN_TOKEN` the operator
  routes answer `404`, so an unconfigured deployment has no readable surface at
  all rather than an unauthenticated one.
- **Nothing is echoed.** A response never repeats a submitted value beyond the
  reference and attachment names; error bodies are static codes. Database and
  provider errors are logged as a message without row contents and returned as a
  generic `503`.
- **Attachments are inert.** Bytes are never unpacked, executed, transformed or
  served inline: the key is generated server-side, the stored name is reduced to
  a single segment, the response is `attachment` + `nosniff` +
  `content-security-policy: default-src 'none'; sandbox` +
  `cross-origin-resource-policy: same-origin`, so opening a file in a browser
  cannot run it or hand anything to another page.
- **No browser can replay the token.** CORS allows only `content-type` as a
  request header, so a script running on any origin — including the site origin —
  cannot attach an `authorization` header.
- **Transport and response hardening.** Every response carries `no-store`,
  `nosniff`, `referrer-policy: no-referrer` and HSTS; nothing is cacheable by an
  intermediary.

This repository is publicly readable, so anything committed is world-readable
forever. `pnpm scan:secrets --needle <value>` (or `--needles-file <path>`) refuses
a tree that tracks a `.secrets/` or export path, that ever tracked one, that
contains a credential-shaped string, or whose history contains a known value. It
prints paths and commit ids only, never the matched text. Run it before a release
and any time a token or a personal record is copied into the tree.

Residual properties an operator should know:

- **A duplicate answer is an oracle.** `200 duplicate` versus `201 received`
  confirms that an identical submission already exists, but only to someone who
  already knows the exact name, email, message and attachment bytes, and only
  within the 5-per-hour limit. This is inherent to telling a visitor "we already
  have this"; it reveals nothing about any other record.
- **The address digest is pseudonymous, not anonymous.** `ip_hash` is a salted
  SHA-256 of the client address, stored so abuse can be traced to a rate-limit
  bucket. It is never returned by any route.
- **Attachments are at rest in R2 under platform-managed encryption.** This
  service adds no encryption of its own; anyone who controls the Cloudflare
  account, the Sites project, or the operator token can read the objects.
- **The preview environment must not be published.** It has its own database and
  bucket and no operator token, so a published preview is a write-only sink for
  real visitor data. Publish production only.

## Erasing a submission

The privacy notice promises deletion on request, so erasure is an implemented
operation, not a manual database edit:

```bash
# One submission: the reference is required, and --yes confirms permanence.
node services/intake/scripts/delete-submission.mjs <reference> --yes \
  --token-file ~/.config/ovanite/intake-admin-token
```

`DELETE /api/intake/<reference>` removes the R2 objects first, then the
`intake_file` rows and the record in one D1 batch, and writes an audit line
(`intake_submission_deleted`, with the reference and attachment count, no
personal data). If an object cannot be removed the call fails and the record is
left intact, so a retry still finds every attachment it is responsible for.

### Retention purge

The notice also says a submission is deleted at most 12 months after review. The
purge is dry by default and reports exactly what it would remove:

```bash
node services/intake/scripts/delete-submission.mjs --older-than-days 365 \
  --token-file ~/.config/ovanite/intake-admin-token

# Same command with --yes actually deletes.
node services/intake/scripts/delete-submission.mjs --older-than-days 365 --yes \
  --token-file ~/.config/ovanite/intake-admin-token
```

## Privacy

The client address is never stored. `ip_hash` is a salted SHA-256 digest used
only for rate limiting, and `RATE_SALT` should be a stable non-public value.
Submissions contain personal data: retention and deletion follow
[`docs/operations/backup-and-retention.md`](../../docs/operations/backup-and-retention.md).

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB` | yes | D1 binding; `schema.sql` is applied idempotently on first request |
| `FILES` | for attachments | R2 binding; without it a submission carrying files is refused with `503` |
| `ALLOWED_ORIGINS` | recommended | Comma-separated browser origins; defaults to `https://ovanite.vercel.app` |
| `RATE_SALT` | recommended | Salt for the IP digest |
| `INTAKE_ADMIN_TOKEN` | required to retrieve | ≥ 32 characters; enables the operator read path and attachments. Without it those routes answer `404` on purpose, so a misconfigured deployment exposes nothing |

The frontend reaches the service through the `intake_api_origin` key in
`env.json`, generated from `OVANITE_INTAKE_API_ORIGIN`.

## Tests

```bash
node --test services/intake/test/*.test.mjs
```

The suite exercises the handler against an in-memory store: validation, duplicate
handling, honeypot, rate limiting, origin refusal, payload limits, and the
operator read path.
