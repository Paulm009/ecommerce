# TiketMark — Design System

## Visual direction

TiketMark is a ticketing and event-commerce platform. Its interface is inspired by
Netflix: **dark-first, cinematic, content-forward**. The screen belongs to the
events — the UI frames them, never competes with them.

Three words define the look:

1. **Cinematic:** pure-black canvases, large imagery, generous hero typography.
2. **Bold:** one accent color, used with intent. Red means action.
3. **Effortless:** the next step is always obvious; nothing decorative blocks it.

The interface avoids:

- accent colors other than brand red for interactive affordances;
- gradients without a narrative purpose (only hero glows and image legibility scrims);
- glassmorphism on work screens;
- mixed border radii or ad-hoc shadows;
- invented components when shadcn/ui already provides the right pattern.

## Brand

- **Name:** TiketMark (no "c"). Always written exactly like this.
- **Logo:** red ticket with the "TM" monogram (`public/logo.svg`).
- **Wordmark:** `TiketMark` in brand red, `font-black tracking-tight`, next to the logo.
- **Icon set:** favicon package installed in `public/` (`favicon.ico`, `favicon.svg`,
  `favicon-96x96.png`, `apple-touch-icon.png`, `site.webmanifest`,
  `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`).

## Color

### Core palette

| Token         | Hex       | Role                                              |
| ------------- | --------- | ------------------------------------------------- |
| `brand`       | `#d11f16` | Primary action, brand accent, wordmark            |
| `night`       | `#000000` | Dark canvas (Netflix black)                       |
| —             | `#ffffff` | Primary text on dark, light canvas                |
| `smoke`       | `#554e4d` | Warm gray: muted text on light, subtle neutrals   |
| `brand-dark`  | `#7c1916` | Deep red: gradients, pressed states, depth        |

### Extended palette

Derived tones that complete the system (defined in `resources/css/app.css`):

| Token           | Hex       | Role                                                   |
| --------------- | --------- | ------------------------------------------------------ |
| `brand-hover`   | `#b81912` | Hover on solid red buttons                             |
| `brand-light`   | `#f0554d` | Small accent text/icons on black (passes contrast)     |
| `smoke-light`   | `#a9a3a2` | Muted text on dark                                     |
| `night-soft`    | `#141414` | Cards/popovers on dark                                 |
| `night-raise`   | `#1f1c1c` | Raised surfaces, secondary fills on dark               |

### Usage rules

- **Red is reserved for action and brand.** Primary buttons, the wordmark, key
  accents. Never use red for decoration or for large background fills.
- On black, use `text-brand-light` for small accent text (eyebrows, dates, icons);
  `#d11f16` on black does not meet contrast for small text — reserve it for
  large/bold elements, solid fills, and borders.
- Solid primary buttons: `bg-brand text-white hover:bg-brand-hover`.
- Tinted brand surfaces: `bg-brand/10`, hover borders `border-brand/40`–`border-brand/50`.
- Hero glows use the two reds at low opacity:
  `bg-[radial-gradient(circle_at_top_right,rgba(209,31,22,.28),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(124,25,22,.22),transparent_40%)]`.

### Functional colors (not brand)

Status semantics stay independent of the accent:

- **Warning / pending / countdown:** amber (`text-amber-400`, `bg-amber-300/10`).
- **Error / expired:** red-tailwind (`text-red-300`, `bg-red-500/10`) — acceptable
  because it always carries an icon or label, never a CTA.
- **Info:** blue. **Success:** green.
- Never rely on color alone: every status pairs color with text or an icon.

### Semantic tokens

All theming flows through the CSS variables in `resources/css/app.css`
(`--primary`, `--background`, `--card`, `--muted-foreground`, …). Light theme is a
clean white surface with red primary; dark theme is the Netflix black system.
Component code must consume semantic utilities (`bg-primary`, `text-muted-foreground`)
and brand utilities (`bg-brand`, `text-brand-light`) — never raw palette classes
(`red-600`, `zinc-*`) in new shared components. Public marketing pages may keep
explicit `white/*` transparency utilities over the black canvas.

## Typography

- Font: Instrument Sans (system fallback stack).
- Hero title: `text-5xl sm:text-7xl font-black tracking-[-.05em] leading-[.95]`.
- Page title (app): `text-2xl font-semibold tracking-tight`.
- Section title: `text-lg font-semibold`; marketing sections may use
  `text-3xl sm:text-5xl font-black`.
- Eyebrow / kicker: `text-sm font-bold uppercase tracking-[.25em]` in `text-brand`
  or `text-brand-light`.
- Body: `text-sm`/`text-base`; secondary: `text-sm text-zinc-400` on dark,
  `text-muted-foreground` in app screens.
- Amounts and quantities align right and use tabular formatting.

## Spacing & geometry

- Page container: `space-y-6`; marketing sections: `py-16`–`py-20`.
- Horizontal padding: `px-4 sm:px-6`, max width `max-w-7xl`.
- Cards: `rounded-2xl border border-white/10 bg-white/[.03]` on dark;
  `p-4 sm:p-6` (marketing cards `p-7`).
- Radius from theme (`--radius`); marketing heroes may use `rounded-[2rem]`.
- Elevation is expressed through borders and surface tints, not heavy shadows;
  a soft `shadow-brand/20` is allowed on hero showpieces.

## Netflix-inspired patterns

### Sticky top navigation

`sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl`.
Logo + red wordmark left; text links `text-zinc-300 hover:text-white`; one red
primary CTA right. Mobile collapses into a simple stacked menu.

### Hero

Full-bleed black section, red radial glows, oversized black-weight headline with
one red accent phrase, supporting paragraph in `text-zinc-400`, and a maximum of
two CTAs (primary red + ghost outline).

### Content cards & rails

Event/product cards behave like Netflix tiles: image-forward, `aspect-[16/10]`,
hover lifts (`hover:-translate-y-1`) with a red border reveal
(`hover:border-brand/50`), title reacts with `group-hover:text-brand-light`.
Images always get a bottom scrim (`bg-gradient-to-t from-zinc-950 …`) so overlaid
text stays legible.

### Showpiece card

A single rotated feature card (`rotate-2`, `rounded-[2rem]`) may carry the brand
gradient `from-brand via-brand-dark to-black`. One per page, maximum.

## App screens (admin / operations)

- Dark or light theme via the semantic tokens; hierarchy and legibility identical.
- shadcn/ui components first; brand red flows in automatically through `--primary`.
- Controlled density: tables for comparison, right-aligned amounts, filters in a
  toolbar, helpful empty states, skeletons while loading.
- One primary action per view; destructive actions always require confirmation.

## Accessibility

- Focus visible everywhere; ring color is brand red.
- Contrast: `brand` on black only for large text/fills; small accent text uses
  `brand-light`. White on `brand` passes for button labels.
- Interactive elements keep accessible labels (nav toggle, icon-only buttons).
- Spanish copy preserves its accents and punctuation; files stay UTF-8.

## SEO baseline

- `resources/views/app.blade.php` carries the global meta set: description,
  keywords, robots, canonical, Open Graph, Twitter Card, `theme-color #000000`,
  manifest, and the full favicon package.
- Every Inertia page sets a specific `<Head title="…" />`; titles render as
  `TiketMark` via `config('app.name')`.
- Keep one `<h1>` per page and meaningful `alt` text on imagery.

## Do / Don't

- **Do** let event imagery dominate; UI chrome recedes.
- **Do** use the brand tokens (`bg-brand`, `text-brand-light`) instead of raw hex.
- **Do** keep one accent color per interaction.
- **Don't** introduce new accent hues for decoration.
- **Don't** put multi-step workflows in dialogs or nest cards without purpose.
- **Don't** use red both as brand and as functional error in the same view without
  an icon/label disambiguating.
