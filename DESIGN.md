# Design tokens

Single source of truth for color and type. Every component should use these
semantic names instead of raw Tailwind palette classes (`blue-600`, `purple-600`,
`text-sm`, etc). The point: when this app gets rebuilt in SwiftUI for the
desktop app, these tokens map directly — no re-deriving a palette from
scattered hex codes.

## Color

Defined in `tailwind.config.ts`. Each token is an actual Apple HIG system
color, so the web app already looks native and the SwiftUI port is a literal
find-and-replace.

| Tailwind class | Hex (light) | Hex (dark) | SwiftUI equivalent | Use for |
|---|---|---|---|---|
| `accent` | `#007AFF` | `#0A84FF` | `Color(.systemBlue)` / `.tint(.accentColor)` | Primary actions only (submit, new item) — one accent, not several |
| `success` | `#34C759` | `#30D158` | `Color(.systemGreen)` | Positive financial values, success states |
| `danger` | `#FF3B30` | `#FF453A` | `Color(.systemRed)` | Negative financial values, destructive actions |
| `warning` | `#FF9500` | `#FF9F0A` | `Color(.systemOrange)` | Warnings, pending/overdue states |
| `info` | `#5856D6` | `#5E5CE6` | `Color(.systemIndigo)` | Informational badges/pills — sparingly, never for primary CTAs |

**Rule:** one accent color per screen for primary actions. Green/red are
reserved strictly for financial polarity (profit vs. loss, collected vs.
outstanding) — never used decoratively. Everything else is grayscale
(zinc/gray Tailwind scale).

## Type scale

Named to match SwiftUI's `Font.TextStyle` cases exactly:

| Tailwind class | Size / line-height | SwiftUI equivalent | Use for |
|---|---|---|---|
| `text-largetitle` | 34/41, bold | `.largeTitle` | Page-level hero number (one per screen) |
| `text-title1` | 28/34, bold | `.title` | Section headers |
| `text-title2` | 22/28, bold | `.title2` | Card titles |
| `text-title3` | 20/25, semibold | `.title3` | Subsection headers |
| `text-headline` | 17/22, semibold | `.headline` | Emphasized body text |
| `text-body` | 17/22, regular | `.body` | Default body text |
| `text-callout` | 16/21, regular | `.callout` | Secondary body text |
| `text-subheadline` | 15/20, regular | `.subheadline` | Supporting text |
| `text-footnote` | 13/18, regular | `.footnote` | Metadata, timestamps |
| `text-caption1` | 12/16, regular | `.caption` | Labels, tags |
| `text-caption2` | 11/13, regular | `.caption2` | Fine print |

**Rule:** one `largetitle`/`title1` per screen for the hero metric. Don't let
five KPI tiles compete at the same visual weight — pick the one number that
matters and size everything else down from it.

## Spacing

Tailwind's default 4px-based scale already aligns with Apple's 4pt grid — no
custom scale needed. Keep using `p-4`, `gap-2`, etc. as-is; just don't
introduce arbitrary pixel values (`px-[13px]`) that won't have a clean
SwiftUI (`padding(13)`) equivalent to point back to.
