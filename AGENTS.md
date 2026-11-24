# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from `src/backend/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Head Metadata (SEO and Link Previews)

`src/frontend/index.html` ships static social-sharing tags: `description`, `og:title`,
`og:description`, `og:type` and `twitter:card`. Per-route values are applied at runtime by
`src/frontend/src/components/layout/PageMeta.tsx`, which rewrites title/description/og tags
and, only when a page passes an `image` prop, adds `og:image`, `og:image:alt` and
`twitter:image`. Pages that pass no image deliberately remove those three tags so a
third-party template brand never appears in an Ovanite preview.

There is currently **no default share image**, and Markdown/crawler previews that do not
execute JavaScript see only the static tags. When adding one:

- **Never remove the static meta tags.** Update them instead.
- Keep `og:title` identical to `<title>`, and `og:description` identical to the `description`
  meta tag.
- Add an Ovanite-owned 1200×630 asset under `src/frontend/public/assets/`, reference it with
  an absolute `https://` URL, and pass that URL to `PageMeta` on pages that should show a card.

## Learnings

[No learnings yet]
