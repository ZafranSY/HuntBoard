# HuntBoard — Design System

Based on Cipta Craft brand identity. Defined in `app/globals.css`.

---

## Color Tokens

### Brand (always available)
```css
--color-brand-red:     #E82D2D   /* Signal Red — primary accent */
--color-success-green: #16A34A
--color-warning-amber: #D97706
--color-error-red:     #DC2626
--color-cipta-black:   #0A0A0A
--color-dark-grey:     #1A1A1A
--color-mid-grey:      #6B6B6B
--color-light-grey:    #F4F4F4
--color-border-grey:   #E0E0E0
```

### Light Mode (`:root`)
```css
--background:           #EAE8E4   /* warm off-white */
--foreground:           #2D2D2D
--card:                 #EAE8E4
--primary:              #2D2D2D
--primary-foreground:   #EAE8E4
--secondary:            #D4D2CD
--muted:                #D4D2CD
--muted-foreground:     rgba(45,45,45,0.6)
--border:               rgba(45,45,45,0.15)
--ring:                 #E82D2D   /* Signal Red focus ring */
```

### Dark Mode (`.dark`)
```css
--background:           #0A0A0A
--foreground:           #F4F4F4
--card:                 #141414
--primary:              #F4F4F4
--muted:                #1A1A1A
--border:               rgba(255,255,255,0.08)
```

### Chart Colors
```css
--chart-1: foreground color    /* neutral */
--chart-2: #E82D2D             /* red — applied/rejected */
--chart-3: #16A34A             /* green — offers */
--chart-4: #D97706             /* amber — interviews */
--chart-5: rgba(45,45,45,0.6)  /* muted */
```

---

## Typography

| Role | Font | Weights | Variable |
|---|---|---|---|
| Headings | Plus Jakarta Sans | 700, 800 | `--font-heading` |
| Body / UI | Inter | 400, 500, 600 | `--font-sans` |
| Mono (IDs, numbers) | Geist Mono | 400 | `--font-mono` |

Desktop sizes: H1 48px | H2 36px | H3 28px | H4 22px | Body 16px | Small 14px | Caption 12px  
Letter spacing: -0.02em on headings. Line height: 1.1 headings, 1.65 body.

---

## Border Radius

```css
--radius:      8px (base)
--radius-sm:   calc(var(--radius) * 0.6)   /* ~5px */
--radius-md:   calc(var(--radius) * 0.8)   /* ~6px */
--radius-lg:   var(--radius)               /* 8px */
--radius-xl:   calc(var(--radius) * 1.4)   /* ~11px */
--radius-2xl:  calc(var(--radius) * 1.8)   /* ~14px */
```

---

## Status Badge Colors

| Status | Color |
|---|---|
| `wishlist` | muted/gray |
| `applied` | blue |
| `viewed` / `responded` | purple |
| `interview` | amber (`chart-4`) |
| `technical_test` | orange |
| `final_interview` | orange-dark |
| `offer` | green (`chart-3`) |
| `accepted` | green-dark |
| `rejected` | red (`chart-2`) |
| `ghosted` | gray-faded |
| `withdrawn` | gray |

---

## Priority Colors

Defined in `lib/constants.ts` as `PRIORITY_META`:
- `low` → muted
- `medium` → amber
- `high` → red

---

## Kanban Column Colors

| Column | Dot class |
|---|---|
| Applied | `bg-chart-2` (red) |
| Responded | `bg-chart-1` (foreground) |
| Interview | `bg-chart-4` (amber) |
| Offer | `bg-chart-3` (green) |

---

## Spacing & Layout

- Card padding: `p-4` minimum
- Dashboard: airy, generous whitespace
- Kanban board height: `calc(100vh - 280px)` min `500px`
- Horizontal scroll on Kanban with `overflow-x-auto`
- No gradients on functional elements — gradient only on landing/home page

---

## Components

All from shadcn/ui v4. Located in `components/ui/`:
`tooltip`, `button`, `textarea`, `dropdown-menu`, `tabs`, `avatar`, `dialog`, `badge`, `label`, `sonner`, `input`, `switch`, `card`, `table`, `select`, `separator`

Custom components in `components/`:
- `pipeline-board.tsx` — Kanban
- `applications-table.tsx` — sortable table
- `dashboard-client.tsx` — stats + activity
- `analytics-client.tsx` — Recharts wrapper
- `wishlist-client.tsx` — shared wishlist
- `resumes-client.tsx` — resume tracker
- `auth-card.tsx` — namespace picker
- `app-nav.tsx` — sidebar nav
- `MonksButton.tsx` — custom CTA button

---

## Mobile

- Breakpoints: mobile < 768px, tablet 768–1024px, desktop > 1024px
- Stats cards: 2 columns on mobile
- Kanban: horizontal scroll
- Bottom tab bar on mobile (5 routes)
- FAB (floating action button) bottom-right for quick add
