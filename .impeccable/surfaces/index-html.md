---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: WinList — today ledger

## Scope and mode

The installable PWA's main screen (`index.html`), its add/edit sheet, its settings sheet, and the empty/complete/error states. Mode: **Operate**. The visitor completes a small daily task: see today, add or edit a task, finish it, and let the money it carries post to Money Ledger.

## Audience and job

A Thai-speaking owner of a mid-range or low-end phone, often one-handed and sometimes offline. They want to record a task and its cost or earning without opening a second app, then trust that completion reached the ledger. They also want the current time and date visible at a glance.

## Success and constraints

Success: the full loop (add → due time → finish → money posted → edit/reverse/delete) is clear in one screen, every task carries trustworthy timestamps, and nothing important falls below 44 px. Constraints: Thai UI, 320–1440 px, system light/dark plus an explicit setting, no backend, no external asset at runtime, no fake financial claims. Money Ledger is an existing `localStorage` app with `transactions` and `currentBalance` keys; same-origin direct write is preferred, cross-origin uses a receiver bridge and a queued fallback. Low-end performance rules out heavy blur, canvas, and large animation loops.

## Chosen direction

A **working accountant's columnar pad** (position 5 of 7 grounded directions; the four more emotional directions were the school timetable, time card, desk calendar, and savings-stamp book). It lends only type, palette, density, and one signature move; the navigation and controls stay standard for a web app. The page must never become a faux ledger sheet or a skeuomorphic prop.

- Ground: pale green-grey paper, never warm cream; ink is green-black, not pure black.
- Type: Bai Jamjuree for display and money columns, Anuphan for body and controls; numerals tabular.
- Colour jobs: vermilion for expense and completion stamps, deep green for income and posted state, amber for queued/review states.
- Density: tight column rhythm, generous row hit areas, hairline rules, one double rule above the day's totals.
- Signature move: completing a task presses a small rotated **WIN** stamp onto its check cell and posts the amount to the money column / Money Ledger with a visible timestamp.
- Dark mode is the same desk after dark: deep green-black ground, pale ink, amber LCD backlight. Not a neon theme.

## Memorable moment

The check cell becomes a stamp: press once, the task's title takes an ink strike, its amount becomes a signed ledger figure, and a tiny status line says whether it reached Money Ledger. The digital watch, date, total, and timestamps all agree.

## Unresolved

- Final hosting URL and Money Ledger origin; the settings field and receiver bridge make this configurable.
- Whether the owner will add the one-line receiver script to Money Ledger or use the shipped patched copy.
- Future surfaces (weekly review, archive, goals) are out of scope.

## Direction contract

THESIS: A daily task list that behaves like a working accountant's pad, where finishing is a posting event — not a productivity dashboard, and not a faux paper prop.
OWN-WORLD: Pale green-grey ground, green-black ink, vermilion expense/stamp, deep green income; Bai Jamjuree display and tabular money, Anuphan body; hairline column rhythm, one double rule; a rotated WIN stamp and a seven-segment time readout as the only spectacle.
STORY: The visitor sees the date, the exact time, and today's wins; adds a task with an optional amount; finishes it; watches the amount become a signed ledger entry with a timestamp and a sync state; can undo the completion and reverse the entry.
FIRST VIEWPORT: A slim wordmark bar; below it a wide date-and-clock band (large Thai day numeral, weekday, Buddhist-era month/year on the left; a framed seven-segment HH:MM:SS readout on the right); beneath it the day's trial-balance line and four standard tabs; then the list, with the primary "เขียนรายการ" action pinned within thumb reach.
FORM: 5th of 7 grounded directions, after the school timetable, work time card, tear-off calendar, and savings-stamp book. seed: b19749c8e9d9f7e0
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
