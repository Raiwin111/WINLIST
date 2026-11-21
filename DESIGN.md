# DESIGN.md — WinList

**seed:** `b19749c8e9d9f7e0`

> *This file records the design intent and tokens for the WinList PWA. It is the source of truth for the visual system, interaction patterns, and theming. Do not drift from these tokens without updating both this file and the corresponding code tokens.*

---

## 1. Direction & Scope

- **Direction:** 5th of 7 grounded directions — *working accountant's columnar pad*
- **Mode:** Operate — the visitor completes a daily task, sees money movement, and trusts the trail
- **Product:** Personal daily list where a task can carry a real amount of money; completing a task posts that amount as an expense or income into Money Ledger
- **Seed:** `b19749c8e9d9f7e0` (recorded in `.impeccable/design.json` and surfaced at `.impeccable/surfaces/index-html.md`)

### 1.1 Thesis
A daily task list that behaves like a working accountant's pad, where finishing is a posting event — not a productivity dashboard, and not a faux paper prop.

### 1.2 Own-World
- Pale green-grey ground, green-black ink, vermilion expense/stamp, deep green income
- Bai Jamjuree display and tabular money, Anuphan body
- Hairline column rhythm, one double rule
- Rotated WIN stamp and seven-segment time readout as the only spectacle

### 1.3 Story
The visitor sees the date, the exact time, and today's wins; adds a task with an optional amount; finishes it; watches the amount become a signed ledger entry with a timestamp and a sync state; can undo the completion and reverse the entry.

### 1.4 First Viewport
- Slim wordmark bar
- Wide date-and-clock band (large Thai day numeral, weekday, Buddhist-era month/year on the left; framed seven-segment HH:MM:SS readout on the right)
- Day's trial-balance line
- Four standard tabs
- Primary "เขียนรายการ" action pinned within thumb reach

---

## 2. Colour System

| Role | Light | Dark | Description |
|---|---|---|---|
| **Ground (paper)** | `#e4e8e4` (pale green-grey) | `#1e3a24` (deep green-black) | Never warm cream |
| **Ink (body text)** | `#2a2a20` (green-black) | `#c8e6c9` (pale green) | |
| **Expense / WIN stamp** | `#e53935` (vermilion) | `#e53935` (vermilion, brighter contrast) | Negative amounts `−฿xxx.xx` |
| **Income / Posted state** | `#2e7d32` (deep green) | `#a5d6a7` (light green) | Positive amounts `+฿xxx.xx` |
| **Amber (queue / review)** | `#fbc02d` | `#fbc02d` | Queued state, LCD backlight tinge |
| **Separator / rule** | `#78909c` (hairline) | `#78909c` (hairline, slightly lighter in dark) | |

### 2.1 Colour Meaning
- **Vermilion** = expense / completion stamp / WIN mark
- **Deep green** = income / posted state
- **Amber** = queued/review state, LCD backlight
- Colours are never the *only* conveyance of type; money figures are signed `−/+`

---

## 3. Typography

- **Display:** Bai Jamjuree (6 weights: 400, 500, 600, 700; latin + thai subsets) — downloaded locally as WOFF2
- **Body:** Anuphan (latin + thai subsets) — downloaded locally as WOFF2
- **Numerals:** Tabular width throughout (money columns, totals)
- **Size scale (computed from 1rem = 16px):**
  - 0.75rem = 12px (captions, meta)
  - 0.875rem = 14px (controls, smaller body)
  - 1rem = 16px (base body)
  - 1.25rem = 20px (headings, tab labels)
  - 1.5rem = 24px (major headings)
  - 2rem = 32px (page title, wordmark)
  - 3rem = 48px (possible: large timestamp, but not used as primary)

- **Line height:** 1.5 for body, 1.3 for display
- **Letter tracking:** floor -0.04em on display, 0 on body
- **Measure:** 65–75ch for body text; money columns narrower, fixed-width number format

---

## 4. Layout & Rhythm

- **Column structure:** Fixed 5-column grid
  1. Task description
  2. Due time / clock
  3. Amount (money)
  4. Check cell (stamp)
  5. Status / sync indicator

- **Row height:** `1.5rem` compact, generous vertical spacing above/below the day's list
- **Double rule:** One hairline rule above the day's totals; one double-rule variant for section separation
- **Hit areas:** All touch targets ≥ 44 px (4.4rem), including tabs, buttons, check cells, and amount inline edit

### 4.1 Responsive breakpoints
| Width | Behaviour |
|---|---|
| 320–480px (phone) | Single column, full-width tabs, clock band stacks left/right |
| 481–768px (tablet) | Two-column layout possible, clock band stays full-width |
| 769–1440px (desktop) | Multi-column, tabs horizontal, wider margins |

- **Never below 320 px** — layout scales gracefully, no horizontal overflow
- **Font size never scales below 12 px** (captions may hit this at 320 px)

---

## 5. Interaction & States

### 5.1 Check cell (signature move)
- Empty state: outlined checkmark glyph (neutral)
- Completed state: small **WIN** stamp rotated 15° clockwise, filled vermilion, overlaid on check cell
- The stamp is *only* a visual overlay; tapping it toggles completion
- On completion: amount becomes a signed figure (`−/+=฿xxx.xx`), timestamp records, money posts to ledger

### 5.2 Money column format
- Signed figures: `−฿450.00` (expense) or `+฿3,500.00` (income)
- No reliance on colour to convey sign; the `−` and `+` prefixes are always present
- Thousand separator: comma (e.g., `+฿1,500.00`)

### 5.3 Sync states
- **Pending** (amber): task finished, money posted to queue, not yet confirmed in ledger
- **Synced** (deep green): confirmation received from ledger (same-origin direct write) or bridge ACK
- **Failed** (vermilion with exclamation): bridge error, queued for retry
- **Offline** (amber LCD tint): running in standalone mode, data in localStorage only

### 5.4 Theme states
- **System:** follows OS light/dark preference
- **Light:** ground `#e4e8e4`, ink `#2a2a20`, amber `#fbc02d`
- **Deep dark:** ground `#1e3a24`, ink `#c8e6c9`, amber `#fbc02d`
- No neon, no gradient text, no glass/blur as decoration

---

## 6. Accessibility & Inclusion

- **Contrast:** body/background ≥ 4.5:1, large text ≥ 3:1 (verified per built result)
- **Focus:** visible focus ring on all interactive elements, logical tab order
- **Touch:** minimum 44 px hit targets, spacing between touch targets ≥ 8 px
- **Screen reader:** heading hierarchy preserved; money figures have `aria-label` with spoken form; stamp action announced as "mark complete, expense/income amount posted"
- **Language:** Thai UI strings, numerals in Thai script where appropriate; Arabic numerals used in money columns for clarity
- **Zoom:** page reflows gracefully at zoom 150–200%; no cutoff or squishing

---

## 7. Motion & Animation

- **One authored moment only:** the WIN stamp "pressing" into the check cell on completion
- Ease-out exponential from already-visible default — not a scattered entrance effect
- No identical entrance on every section
- Motion belongs from the palette: shadow, backdrop-filter, clip-all carry the green/amber/vermilion tones
- Clock hand/seven-segment update is functional, not decorative — runs every second via `requestAnimationFrame` / `setTimeout`

---

## 8. Browser Surfaces (default UA styles, themed)

- **Text selection:** background tinted from palette ink, colour from palette ground
- **Caret:** coloured from ink hue
- **Custom scrollbars:** track thumb and track coloured from palette, thumb slightly wider for touch
- **Focus rings:** 2px solid `ink`, with 4px offset transparent inset, consistent across themes
- **Underline offset:** themed from `ink` hue, not browser default

---

## 9. Unresolved / Configurable at Deploy

| Item | Value at ship | Configurable via settings |
|---|---|---|
| `ledgerVerified` | `false` (same-origin preferred) | Settings toggle true/false |
| Bridge script inclusion | `bridge/money-ledger-receiver.js` (cross-origin) | On/Off |
| Default theme | `system` | Choose light/dark/system |
| Queue retry count | `5` | Settings numeric field |
| Export/import JSON key | `winlist_tasks` | Persisted in `settings` |

---

## 10. Disclosure

- The **Impeccable finish reviewer subagent** was unavailable during this session. This `DESIGN.md` and the accompanying `.impeccable/design.json` were produced through in-thread review and deterministic design-token extraction from the built UI.
- All visual decisions (palette, typography, spacing, interaction) are grounded in the surface brief `.impeccable/surfaces/index-html.md` and the product directive PRODUCT.md.
- No automated design detector was active this session; manual review was used exclusively. Upon activation of the hook, future edits will be auto-scanned per `impeccable context` directives.

---
*End of DESIGN.md*