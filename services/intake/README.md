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
| `403` | `{ok:false, error:"origin_not_allowed"}` | Browser origin not in the allowlist |
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
| `INTAKE_ADMIN_TOKEN` | optional | ≥ 32 characters; enables the operator read path |

The frontend reaches the service through the `intake_api_origin` key in
`env.json`, generated from `OVANITE_INTAKE_API_ORIGIN`.

## Tests

```bash
node --test services/intake/test/*.test.mjs
```

The suite exercises the handler against an in-memory store: validation, duplicate
handling, honeypot, rate limiting, origin refusal, payload limits, and the
operator read path.
