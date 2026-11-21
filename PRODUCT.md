# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static PWA: hand-authored HTML, CSS, and vanilla JavaScript with no runtime dependencies. Ships as an installable PWA plus a single-file offline build. The user chose a multi-file PWA and a hosted install path; the offline single file is a delivery convenience, not a second product.

## Users

The primary user is the owner of the phone and of the existing Money Ledger app: a Thai-speaking person planning everyday tasks and tracking the money those tasks earn or cost. They use the app in short sessions, often one-handed, on a mid-range or low-end Android phone, and sometimes at a desk. Secondary users are not confirmed.

## Product Purpose

WinList is a personal daily list where a task can carry a real amount of money. Finishing a task with money attached posts that amount as an expense or income into Money Ledger. The list therefore answers two questions in one place: what did I finish today, and what did today cost or earn? Success means the user can add, edit, finish, and remove a task in seconds, and trusts that every money movement is accounted for.

## Positioning

The unit of the product is a *win with a consequence*: a task, a timestamp, and an optional money movement that is posted to a ledger only when the task is completed. Ordinary to-do apps separate tasks from money; budget apps separate money from the work that caused it. WinList makes completion the posting event, with a visible, reversible trail.

## Operating Context

- Tasks are personal, Thai-language, and mostly same-day; some carry a due date and time.
- A task can be marked as spending money or earning money, with an amount and a category that match Money Ledger's categories.
- Completion can create a Money Ledger transaction; uncompleting or deleting a completed task must reverse it.
- Money Ledger is an existing standalone HTML app using `localStorage` keys `transactions` and `currentBalance`. Its transaction shape is `{ id, type: "income" | "expense", description, category, amount, date, month }`.
- The phone may be offline. Local data must survive without a network; ledger sync may be queued and completed later.
- The app includes a live digital clock and the full Thai date, in both light and dark themes.

## Capabilities and Constraints

Confirmed in the brief:
- Add, edit, and delete tasks.
- Every task shows timestamps; completion time is recorded.
- Digital clock showing the current time, plus the date.
- Light and dark modes, user-selectable.
- Tasks can carry an expense or income, with the amount posted to Money Ledger on completion.
- Mobile-first, responsive, easy to tap, and considerate of low-performance phones.
- Downloadable and usable on a phone immediately.
- Visual quality explicitly must not read as generic AI-generated UI (user's words: “ไม่ AI Slop”).
- Direct Money Ledger integration is preferred in this round, with a queue fallback if the browser blocks it.

Technical constraints:
- No backend, no account, no network dependency for core use.
- Data lives in `localStorage`; schema is versioned and exportable as JSON.
- PWA installation requires HTTPS or localhost; opening the single file directly remains a supported offline path.

Undecided:
- Hosting location and the final public URL of Money Ledger.
- Whether to patch the existing Money Ledger app with a receiver, or keep the integration to same-origin storage plus a handoff file. The user asked to attempt the most direct connection possible, so a small, opt-in bridge will be shipped and documented.

## Brand Commitments

- Name: **WinList** (chosen by the user).
- Language: Thai interface, with English reserved for the wordmark and technical labels.
- The product must feel deliberately designed, not templated: no generic AI aesthetic.
- Clock and date are part of the product's identity, not a widget added afterward.
- Money is handled with clarity and restraint; no gamified finance, no fake rewards, no invented financial claims.

## Evidence on Hand

- Existing Money Ledger source at `C:\Users\Raiwin Rungseerat\Desktop\WebMangageMent Monney\index.html` and its calendar variant; its `localStorage` contract is verified in the code.
- No user research, testimonials, analytics, brand assets, or real transaction data were provided. Do not fabricate any.
- All task and money examples in the UI are synthetic and must be labeled or obviously editable.

## Product Principles

1. **Completion is the posting event.** A money amount is not a decorative tag; it moves when the task is finished and moves back when that completion is undone.
2. **One screen, one hand.** The common loop—see today, add a task, finish it—must work with a thumb, at 360 px, on a slow phone.
3. **Trust through a visible trail.** Show when a task was created, edited, and completed, and show whether its money reached the ledger.
4. **Timestamp everything that matters.** Time is content, not chrome; the clock and the record must agree.
5. **Quiet surface, precise details.** Operate-mode restraint with one memorable, product-specific moment: the win being stamped and posted.

## Accessibility & Inclusion

- Thai-first language and Thai Buddhist-era dates alongside the digital clock.
- Touch targets at least 44 × 44 CSS px; primary controls at least 48 px.
- Body contrast at least 4.5:1 in both themes; focus-visible states; reduced-motion support.
- No reliance on color alone for income vs. expense or completion.
- Layout must remain usable at 320 px width and with 200% text zoom.
