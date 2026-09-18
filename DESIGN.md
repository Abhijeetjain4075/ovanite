# Design Brief

## Direction

Ovanite — a precise, light-first Swiss-technical identity for a software company that builds products designed to matter.

## Tone

Refined technical minimalism: near-black navy ink on white paper, hairline rules, mono eyebrow labels, and one restrained cobalt accent — confidence through restraint, never decoration.

## Differentiation

The "engineering ledger" system: every section is introduced by a mono index label (`01 — PHILOSOPHY`) over a hairline rule, giving the site the cadence of a well-specified technical document rather than a marketing page.

## Color Palette

| Token      | OKLCH         | Role                                            |
| ---------- | ------------- | ----------------------------------------------- |
| background | `0.995 0.002 250` | White paper surface (light-first)           |
| foreground | `0.19 0.028 258`  | Near-black deep-navy ink for text           |
| card       | `1 0 0`           | Pure white raised surfaces                  |
| primary    | `0.45 0.17 258`   | Restrained deep cobalt — CTAs, active states |
| accent     | `0.68 0.16 52`    | Subtle warm orange — tiny highlights only   |
| muted      | `0.965 0.005 255` | Section alternation, secondary fills        |
| ink        | `0.2 0.032 258`   | Deep-navy contrast bands (footer)           |

## Typography

- Display: Space Grotesk — hero and section headings, tight tracking, weight 500–700
- Body: General Sans — paragraphs, nav, UI labels, weight 400–500
- Mono: Geist Mono — eyebrow labels, indices, metadata, weight 400–500
- Scale: hero `text-5xl md:text-7xl font-display font-bold tracking-tight`, h2 `text-3xl md:text-5xl font-display font-bold tracking-tight`, label `eyebrow` (mono, uppercase, `tracking-[0.22em]`), body `text-base md:text-lg leading-relaxed`

## Elevation & Depth

Flat by default — depth comes from hairline borders (`border-border`), white-on-muted alternation, and a fine 56px technical grid; shadows are reserved for interactive lift only (`shadow-subtle`, `shadow-elevated`).

## Structural Zones

| Zone    | Background             | Border     | Notes                                                        |
| ------- | ---------------------- | ---------- | ------------------------------------------------------------ |
| Header  | `bg-background/85` + blur | `border-b` | Sticky, 72px tall, wordmark left, nav + solid cobalt CTA right |
| Content | `bg-background` alternating `bg-muted/40` | — | Sections separated by hairline rules and mono index labels |
| Footer  | `bg-ink text-ink-foreground` | `border-t` | Deep-navy band, wordmark + tagline, 3 link columns, legal row |

## Spacing & Rhythm

Sections use `py-20 md:py-28` with a `max-w-[1400px]` container and `px-6 md:px-10`; content groups at 24–32px, micro-spacing 8–12px, and asymmetric hero composition (7/5 grid split).

## Component Patterns

- Buttons: sharp `rounded-sm` (4px), solid cobalt primary with `hover:bg-primary/90`, ghost secondary with hairline border; no pills, no gradients
- Cards: `rounded-sm`, white surface, 1px `border-border`, hairline lift to `shadow-subtle` on hover; never heavy floating cards
- Badges: mono uppercase micro-labels with hairline border and `bg-muted/60`; accent dot in warm orange for status

## Motion

- Entrance: single orchestrated fade-and-rise (`fade-up`, 500ms, 60ms stagger) on hero and section heads only
- Hover: 200ms color/border shifts plus 1px translate on cards via `transition-smooth`
- Decorative: slow 8s `drift` on the hero grid field only — no bouncing, no glow

## Constraints

- Light-first: navy is ink and contrast, never a dark-mode-only site
- No glassmorphism, neon, gradient blobs, or generic AI imagery
- No robots, brains, circuits, or AI symbols in the brand mark
- Semantic tokens only — no raw hex, `rgb()`, or arbitrary color classes
- Respect `doNotBuild`: no blog, careers, or email-notification surfaces

## Signature Detail

The hairline "index rule" — a 1px full-width line with a mono section number and label sitting on it — repeated across every section as the site's typographic spine.

## Brand Mark

Inline SVG React component, geometric only. An abstract **aperture/portal**: a thick cobalt ring with a flat 45° cut on the lower-right, and a smaller solid navy inner disc offset to the lower-right — reading as a lens, an "O", and a forward vector at once. No robots, brains, circuits, or AI symbols.

- Component: `src/frontend/src/components/brand/OvaniteMark.tsx` — exports `OvaniteMark` (icon, `currentColor`-driven via `text-primary`/`text-foreground`) and `OvaniteWordmark` (mark + `OVANITE` in Space Grotesk, `tracking-[0.18em]`, uppercase).
- Construction: `viewBox="0 0 32 32"`, ring `stroke-width="3"`, inner disc `r="3.2"`; scales cleanly to 16px favicon and 40px navbar.
- Usage: navbar (24px, `text-foreground` mark), footer (24px, `text-ink-foreground`), favicon (16px).
