# Recovery-First Habit Tracker

## Google Stitch Screen Inventory

| Field                                | Value                                                       |
| ------------------------------------ | ----------------------------------------------------------- |
| Document status                      | Authoritative screen-generation inventory for Google Stitch |
| Version                              | 1.0                                                         |
| Prepared                             | 30 July 2026                                                |
| Product stage                        | Greenfield / pre-development                                |
| Platform                             | Responsive website and installable PWA                      |
| Theme                                | Light theme for MVP                                         |
| Authoritative layout reference       | Stitch layout ID `12495258549845976462`                     |
| Product brief                        | `STITCH-BRIEF.md`                                           |
| Visual authority                     | `DESIGN.md`                                                 |
| Supporting interaction specification | `UX-FLOWS.md`                                               |
| Supporting component specification   | `UI-SPEC.md`                                                |

---

# 1. Purpose

This document defines every screen and responsive surface that Google Stitch may generate for the Recovery-First Habit Tracker.

Use it to control:

- which screens exist;
- which screens are generated first;
- which screens are full pages versus dialogs or drawers;
- which operational states apply to each screen;
- which prototype connections must be created;
- which responsive variants are required;
- which screens may share the same application shell;
- which content and interactions must remain consistent.

This inventory does not define backend architecture, database implementation, billing-provider internals, or application code.

---

# 2. Source-of-Truth Order

When references conflict, follow this order:

1. `DESIGN.md` for visual tokens and shared component styling;
2. Stitch layout ID `12495258549845976462` for the application shell;
3. `STITCH-BRIEF.md` for product context and design intent;
4. `SCREEN-INVENTORY.md` for screen scope and generation order;
5. `UX-FLOWS.md` for navigation and interaction sequence;
6. `UI-SPEC.md` for detailed component and state behavior.

Do not silently reinterpret conflicts. Preserve existing approved screens until a specific correction is requested.

---

# 3. Screen Classification

| Type                | Meaning                                                            | Stitch treatment                                                 |
| ------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Full page           | Stable route with its own page header and content area             | Generate desktop, tablet, and mobile variants                    |
| Wizard step         | One step in a multi-step task                                      | Preserve step indicator and form structure                       |
| Dialog              | Focused action over an existing page                               | Preserve background screen and current context                   |
| Drawer              | Contextual action or details panel                                 | Use desktop side panel and mobile bottom sheet where appropriate |
| Inline state        | State displayed inside an existing card or section                 | Do not redesign the full screen                                  |
| Operational variant | Loading, Error, Offline, Conflict, and similar states              | Generate only when listed in the state matrix                    |
| System page         | Authentication, processing, not-found, or account-management route | Use the correct public or application shell                      |

---

# 4. Required Responsive Frames

## 4.1 Primary frames

| Frame                     |   Width | Required use                        |
| ------------------------- | ------: | ----------------------------------- |
| Wide desktop              | 1440 px | All priority full-page screens      |
| Tablet or compact desktop | 1024 px | All application-shell screens       |
| Mobile web                |  390 px | All priority screens and core flows |

## 4.2 Additional validation frames

| Frame           |             Width | Purpose                                         |
| --------------- | ----------------: | ----------------------------------------------- |
| Small mobile    |            360 px | Reflow and minimum-width validation             |
| Large desktop   |           1600 px | Maximum-content-width and whitespace validation |
| Zoom validation | 200% browser zoom | Accessibility and reflow review                 |

## 4.3 Responsive shell rules

At `1024 px` and above:

- use the persistent left sidebar;
- preserve the same navigation order and icon system;
- place page content in the approved central container;
- show contextual side panels only when required.

Below `1024 px`:

- remove the persistent sidebar;
- use the compact top header;
- use the mobile bottom navigation;
- convert large dialogs to full-screen dialogs or bottom sheets when required;
- preserve the same information priority rather than shrinking desktop layouts.

---

# 5. Shared Application Shell

## 5.1 Authoritative application shell

All authenticated and Guest application screens must match Stitch layout ID:

```text
12495258549845976462
```

The shared shell contains:

- product logo and brand area;
- desktop sidebar;
- mobile compact header;
- mobile bottom navigation;
- page header;
- main content container;
- profile or Guest account entry;
- optional global status banner;
- consistent icon library;
- consistent active-navigation treatment.

## 5.2 Primary navigation

```text
Today
Habits
Review
Insights
More
```

Supporting destinations under `More` or the account menu:

```text
Reminders
Settings
Subscription
Help
Account
```

## 5.3 Active navigation mapping

| Screen group                                                           | Active item |
| ---------------------------------------------------------------------- | ----------- |
| Today and check-in surfaces                                            | Today       |
| Habits, creation, Habit Detail, history, versions, and programs        | Habits      |
| Recovery, Check-in Review, Weekly Review, and decisions                | Review      |
| Aggregate and habit-level analytics                                    | Insights    |
| Reminders, Settings, Account, Subscription, Help, export, and deletion | More        |

---

# 6. Generation Priority

Generate screens in this order. Do not generate the complete inventory in one request.

```text
Phase 1 — Design-system board
Phase 2 — Responsive application shell
Phase 3 — Batch 1: Today Dashboard
Phase 4 — Batch 2: Create Habit and Habit Details
Phase 5 — Batch 3: Daily Check-in Flow
Phase 6 — Batch 4: Recovery and Weekly Review
Phase 7 — Authentication and Guest transfer
Phase 8 — Reminders and Insights
Phase 9 — Subscription and Premium
Phase 10 — Settings, privacy, export, and deletion
Phase 11 — Public website and legal pages
Phase 12 — Relevant operational-state variants
Phase 13 — Accessibility and consistency audit
```

---

# 7. Phase 1 — Design-System Board

| ID      | Surface                | Required content                                                                                    |
| ------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| SYS-001 | Design-system overview | Color tokens, typography, spacing, radii, borders, shadows, and motion                              |
| SYS-002 | Navigation system      | Desktop sidebar, mobile header, bottom navigation, active and inactive states                       |
| SYS-003 | Action components      | Primary, secondary, outline, ghost, destructive, and icon buttons                                   |
| SYS-004 | Form system            | Inputs, selects, comboboxes, textareas, checkbox, radio, toggle, date, and time controls            |
| SYS-005 | Card system            | Base card, habit card, session card, recommendation card, Recovery card, and plan card              |
| SYS-006 | Status system          | Full, Minimum, Skipped, Recovery, warning, information, error, offline, and pending-sync indicators |
| SYS-007 | Overlay system         | Dialog, drawer, bottom sheet, dropdown, tooltip, and popover                                        |
| SYS-008 | Feedback system        | Skeleton, spinner, progress, banner, inline error, empty state, toast, and confirmation             |
| SYS-009 | Data visualization     | Accessible progress, comparison bars, trend chart, summary chart, and non-color legend              |
| SYS-010 | Accessibility examples | Focus-visible, keyboard order, disabled state, 200% zoom, and reduced-motion treatment              |

Generate this board before application screens.

---

# 8. Batch 1 — Today Dashboard

## 8.1 Screen inventory

| ID        | Route or surface       | Type           | Required frames    | Description                                               |
| --------- | ---------------------- | -------------- | ------------------ | --------------------------------------------------------- |
| TODAY-001 | `/app/today`           | Full page      | 1440, 1024, 390    | Default Today dashboard with current scheduled sessions   |
| TODAY-002 | Today progress summary | Inline section | Within TODAY-001   | Full, Minimum, remaining, and attention summary           |
| TODAY-003 | Session card — pending | Inline card    | Desktop and mobile | Session ready for check-in                                |
| TODAY-004 | Session card — Full    | Inline card    | Desktop and mobile | Successful Full outcome                                   |
| TODAY-005 | Session card — Minimum | Inline card    | Desktop and mobile | Successful Minimum outcome without failure styling        |
| TODAY-006 | Session card — Skipped | Inline card    | Desktop and mobile | User-recorded Skipped outcome with neutral treatment      |
| TODAY-007 | Attention item         | Inline card    | Desktop and mobile | Check-in Review, Recovery, or pending decision indication |
| TODAY-008 | First-time guidance    | Inline surface | Desktop and mobile | Brief guidance before the first check-in                  |

## 8.2 Today Default content

The Default Today screen should contain:

- greeting and local date;
- daily progress summary;
- current session cards;
- Full, Minimum, and Skipped actions;
- clear browser or synchronization status when relevant;
- attention items below current sessions;
- supportive, non-punitive language.

## 8.3 Today operational states

Generate these only after the Default screen is approved:

| State                            | Required | Treatment                                                    |
| -------------------------------- | -------: | ------------------------------------------------------------ |
| Empty — no habits                |      Yes | Creation CTA and supportive explanation                      |
| Empty — no eligible sessions     |      Yes | Explain that nothing is scheduled today                      |
| Complete — all sessions recorded |      Yes | Calm completion summary without streak pressure              |
| Loading                          |      Yes | Skeletons matching original card sizes                       |
| Error                            |      Yes | Inline or page banner with Retry action                      |
| Offline                          |      Yes | Preserve local content and show non-blocking banner          |
| Pending sync                     |      Yes | Preserve completed check-ins and show synchronization status |
| Session expired                  |      Yes | Preserve intended destination and show sign-in path          |
| Conflict                         |       No | Conflict belongs to the affected edit or check-in surface    |
| Premium locked                   |       No | Core Today use is not Premium-locked                         |
| Destructive confirmation         |       No | No destructive primary action on Today                       |

---

# 9. Batch 2 — Habits and Creation

## 9.1 Habits list

| ID         | Route or surface    | Type                    | Required frames    | Description                                              |
| ---------- | ------------------- | ----------------------- | ------------------ | -------------------------------------------------------- |
| HABITS-001 | `/app/habits`       | Full page               | 1440, 1024, 390    | Active and inactive habits with filters and creation CTA |
| HABITS-002 | Active habit card   | Inline card             | Desktop and mobile | Habit identity, status, next session, and actions        |
| HABITS-003 | Inactive habit row  | Inline item             | Desktop and mobile | Paused, stopped, completed, archived, or Trash state     |
| HABITS-004 | Active-limit notice | Inline banner or dialog | Desktop and mobile | Guest, Free, or expired-Premium limit resolution         |

## 9.2 Create Habit flow

Create Habit consists of three screens. Preserve the same wizard shell and step indicator across all three.

| ID         | Route or surface                | Type                | Required frames    | Description                                        |
| ---------- | ------------------------------- | ------------------- | ------------------ | -------------------------------------------------- |
| CREATE-001 | `/app/habits/new?step=basic`    | Wizard step         | 1440, 1024, 390    | Name, purpose, and optional description            |
| CREATE-002 | `/app/habits/new?step=schedule` | Wizard step         | 1440, 1024, 390    | Schedule, Full definition, and Minimum definition  |
| CREATE-003 | `/app/habits/new?step=review`   | Wizard step         | 1440, 1024, 390    | Review configuration and create habit              |
| CREATE-004 | Unsaved-draft confirmation      | Dialog              | Desktop and mobile | Save draft, discard, or remain in wizard           |
| CREATE-005 | Active-limit resolution         | Dialog or full page | Desktop and mobile | Resolve limit before creating another active habit |

## 9.3 Create Habit operational states

| State                    |     CREATE-001 |     CREATE-002 |                               CREATE-003 | Notes                                                       |
| ------------------------ | -------------: | -------------: | ---------------------------------------: | ----------------------------------------------------------- |
| Default                  |            Yes |            Yes |                                      Yes | Approved original design                                    |
| Disabled                 |            Yes |            Yes |                                      Yes | Continue/Create disabled until valid                        |
| Validation error         |            Yes |            Yes |                                      Yes | Field-specific and summary messaging                        |
| Offline                  |            Yes |            Yes |                                      Yes | Preserve entered content; explain local save or restriction |
| Loading                  |             No |             No |                                      Yes | Only for final create submission                            |
| Pending sync             |             No |             No |                                      Yes | When Guest or offline creation is accepted locally          |
| Conflict                 |             No |             No |                                       No | New habits do not yet have remote configuration conflicts   |
| Premium locked           |             No |             No | Optional programs are handled separately |
| Destructive confirmation | Via CREATE-004 | Via CREATE-004 |                           Via CREATE-004 | Preserve current wizard content behind dialog               |

## 9.4 Habit Detail

| ID         | Route or surface                             | Type                | Required frames    | Description                                                           |
| ---------- | -------------------------------------------- | ------------------- | ------------------ | --------------------------------------------------------------------- |
| DETAIL-001 | `/app/habits/[habitId]`                      | Full page           | 1440, 1024, 390    | Habit Overview with status, schedule, Full, Minimum, and next session |
| DETAIL-002 | `/app/habits/[habitId]?tab=history`          | Full-page tab       | 1440, 1024, 390    | Session and check-in history                                          |
| DETAIL-003 | `/app/habits/[habitId]?tab=changes`          | Full-page tab       | 1440, 1024, 390    | Recommendation and configuration change history                       |
| DETAIL-004 | `/app/habits/[habitId]?tab=versions`         | Full-page tab       | 1440, 1024, 390    | Immutable version history                                             |
| DETAIL-005 | `/app/habits/[habitId]/edit`                 | Full page or drawer | 1440, 1024, 390    | Edit non-material fields or begin redesign                            |
| DETAIL-006 | `/app/habits/[habitId]/versions/[versionId]` | Full page           | 1440, 1024, 390    | Historical version detail                                             |
| DETAIL-007 | Lifecycle action                             | Dialog or drawer    | Desktop and mobile | Pause, resume, stop, complete, archive, restore, or Trash             |
| DETAIL-008 | Restore historical version                   | Confirmation dialog | Desktop and mobile | Create a new version from historical configuration                    |

## 9.5 Habit Detail operational states

```text
Default
Loading
Error
Offline
Pending sync
Conflict
Destructive confirmation
Not found
```

Do not create Premium Locked for ordinary Habit Detail content.

---

# 10. Batch 3 — Daily Check-in Flow

These screens form one connected prototype flow.

```text
Today
→ Select Full, Minimum, or Skipped
→ Optional friction capture
→ Confirmation
→ Updated Today
```

## 10.1 Check-in surfaces

| ID          | Route or surface      | Type                  | Required frames    | Description                                              |
| ----------- | --------------------- | --------------------- | ------------------ | -------------------------------------------------------- |
| CHECKIN-001 | Session check-in      | Dialog or drawer      | 1440 context, 390  | Select Full, Minimum, or Skipped                         |
| CHECKIN-002 | Full confirmation     | Dialog step           | Desktop and mobile | Confirm Full outcome                                     |
| CHECKIN-003 | Minimum confirmation  | Dialog step           | Desktop and mobile | Confirm Minimum as a successful outcome                  |
| CHECKIN-004 | Skipped confirmation  | Dialog step           | Desktop and mobile | Confirm manual Skipped outcome                           |
| CHECKIN-005 | Friction reason       | Dialog step or drawer | Desktop and mobile | Optional structured friction reasons and optional note   |
| CHECKIN-006 | Check-in success      | Confirmation surface  | Desktop and mobile | Outcome summary and synchronization state                |
| CHECKIN-007 | Same-day edit         | Dialog or drawer      | Desktop and mobile | Change a recorded outcome without deleting history       |
| CHECKIN-008 | Unrecorded resolution | Dialog or full page   | Desktop and mobile | Resolve an eligible unresolved session within the window |

## 10.2 Check-in operational states

| State                    | Required | Notes                                                     |
| ------------------------ | -------: | --------------------------------------------------------- |
| Default                  |      Yes | Original check-in design                                  |
| Disabled                 |      Yes | Submit disabled until required selection exists           |
| Error                    |      Yes | Preserve selected outcome and allow Retry                 |
| Offline                  |      Yes | Allow locally supported check-ins and explain sync status |
| Pending sync             |      Yes | Show saved-locally confirmation                           |
| Conflict                 |      Yes | Show remote outcome versus local intended outcome         |
| Loading                  |      Yes | Only during submission or remote refresh                  |
| Destructive confirmation |       No | Editing check-in is not deletion                          |
| Premium locked           |       No | Core check-ins are available to all tiers                 |

---

# 11. Batch 4 — Recovery and Weekly Review

## 11.1 Recovery

| ID           | Route or surface                 | Type             | Required frames    | Description                                              |
| ------------ | -------------------------------- | ---------------- | ------------------ | -------------------------------------------------------- |
| RECOVERY-001 | `/app/review/recovery/[habitId]` | Full page        | 1440, 1024, 390    | Recovery trigger explanation and recommendation          |
| RECOVERY-002 | Recovery recommendation          | Main card        | Desktop and mobile | Signal, reason, proposed change, start timing            |
| RECOVERY-003 | Customize Recovery               | Drawer or dialog | Desktop and mobile | Modify one meaningful variable                           |
| RECOVERY-004 | Recovery progress                | Full page state  | 1440, 1024, 390    | Three scheduled Recovery sessions and progress           |
| RECOVERY-005 | Recovery success                 | Result state     | Desktop and mobile | Supportive result and next action                        |
| RECOVERY-006 | Recovery failed                  | Result state     | Desktop and mobile | Move toward another Recovery Plan or Needs Review        |
| RECOVERY-007 | Needs Review                     | Full page state  | 1440, 1024, 390    | Larger decision required after repeated Recovery failure |

## 11.2 Recovery operational states

```text
Default
Loading
Error
Offline
Pending sync
Premium preview or locked enhancement where applicable
```

Basic Recovery must remain useful for Guest and Free users.

## 11.3 Weekly Review

| ID         | Route or surface                | Type                        | Required frames    | Description                                           |
| ---------- | ------------------------------- | --------------------------- | ------------------ | ----------------------------------------------------- |
| REVIEW-001 | `/app/review/weekly`            | Full page                   | 1440, 1024, 390    | Current Weekly Review summary and recommendations     |
| REVIEW-002 | Outcome summary                 | Inline section              | Desktop and mobile | Full, Minimum, Skipped, and unresolved outcomes       |
| REVIEW-003 | Friction summary                | Inline section              | Desktop and mobile | Structured friction patterns without diagnosis        |
| REVIEW-004 | Recommendation card             | Inline card                 | Desktop and mobile | Signal, explanation, proposed change, and timing      |
| REVIEW-005 | Customize recommendation        | Drawer or dialog            | Desktop and mobile | User edits proposed change                            |
| REVIEW-006 | Batch confirmation              | Dialog or full-screen sheet | Desktop and mobile | Confirm Apply, Customize, and Keep Current selections |
| REVIEW-007 | Completion state                | Full-page state             | Desktop and mobile | Confirm accepted and retained decisions               |
| REVIEW-008 | `/app/review/weekly/[reviewId]` | Historical page             | 1440, 1024, 390    | Read-only historical review                           |

## 11.4 Weekly Review operational states

```text
Default
Empty
Loading
Error
Offline
Pending sync
Premium locked enhancement
```

Do not generate Conflict unless a specific recommendation is being edited across devices.

---

# 12. Authentication and Application Entry

| ID       | Route or surface        | Type                   | Required frames    | Description                                           |
| -------- | ----------------------- | ---------------------- | ------------------ | ----------------------------------------------------- |
| AUTH-001 | `/app`                  | System page            | 1440, 390          | Resolve authenticated, Guest, or first-time entry     |
| AUTH-002 | `/sign-in`              | Public full page       | 1440, 390          | Google and email sign-in choices                      |
| AUTH-003 | Email sent              | Public system page     | 1440, 390          | Magic-link or OTP delivery guidance                   |
| AUTH-004 | Authentication callback | Processing page        | 1440, 390          | Safe sign-in processing state                         |
| AUTH-005 | Session expired         | Dialog or full page    | Desktop and mobile | Re-authenticate while preserving intended destination |
| AUTH-006 | Guest transfer preview  | Full page or dialog    | 1440, 390          | Show Guest records before transfer                    |
| AUTH-007 | Guest merge resolution  | Full page              | 1440, 390          | Resolve active-limit and duplicate conflicts          |
| AUTH-008 | Guest transfer success  | Confirmation page      | 1440, 390          | Confirm cloud-backed account state                    |
| AUTH-009 | Guest transfer failure  | Recoverable error page | 1440, 390          | Preserve local data and provide Retry                 |

Operational states:

```text
Default
Loading
Error
Offline
Session expired
Conflict during Guest merge
```

---

# 13. Reminders

| ID           | Route or surface    | Type                        | Required frames    | Description                                       |
| ------------ | ------------------- | --------------------------- | ------------------ | ------------------------------------------------- |
| REMINDER-001 | `/app/reminders`    | Full page                   | 1440, 1024, 390    | Reminder schedules and permission state           |
| REMINDER-002 | Reminder editor     | Drawer or full-screen sheet | Desktop and mobile | Schedule, channel, timing, and enabled state      |
| REMINDER-003 | Web Push education  | Dialog                      | Desktop and mobile | Explain benefit before browser permission request |
| REMINDER-004 | Permission granted  | Inline success              | Desktop and mobile | Confirm browser notification availability         |
| REMINDER-005 | Permission denied   | Inline state                | Desktop and mobile | Explain browser-level recovery steps              |
| REMINDER-006 | Unsupported browser | Inline state                | Desktop and mobile | Explain fallback options                          |
| REMINDER-007 | Adaptive suggestion | Recommendation card         | Desktop and mobile | Suggest timing adjustment with user approval      |
| REMINDER-008 | Reduction trial     | Drawer or card              | Desktop and mobile | Temporary reminder reduction proposal             |

Operational states:

```text
Default
Empty
Loading
Error
Offline
Disabled
Permission denied
Unsupported
Premium locked enhancement
```

---

# 14. Insights

| ID           | Route or surface        | Type                       | Required frames    | Description                                                      |
| ------------ | ----------------------- | -------------------------- | ------------------ | ---------------------------------------------------------------- |
| INSIGHTS-001 | `/app/insights`         | Full page                  | 1440, 1024, 390    | Aggregate outcomes and patterns                                  |
| INSIGHTS-002 | Habit comparison        | Inline section             | Desktop and mobile | Compare selected habits with accessible legend                   |
| INSIGHTS-003 | Habit-level insights    | Full-page detail or drawer | 1440, 1024, 390    | Outcome and friction detail for one habit                        |
| INSIGHTS-004 | Minimum-heavy pattern   | Insight card               | Desktop and mobile | Supportive interpretation without failure language               |
| INSIGHTS-005 | Stable habit pattern    | Insight card               | Desktop and mobile | Calm confirmation and optional next step                         |
| INSIGHTS-006 | Premium insight preview | Locked card                | Desktop and mobile | Show value without exposing private data or manipulative urgency |

Operational states:

```text
Default
Empty — no completed sessions
Insufficient data
Loading
Error
Offline cached data
Premium locked
```

All charts require:

- text summary;
- non-color legend;
- accessible labels;
- keyboard and screen-reader compatibility;
- no red-versus-green-only distinction.

---

# 15. Premium Programs

| ID          | Route or surface       | Type                | Required frames    | Description                                     |
| ----------- | ---------------------- | ------------------- | ------------------ | ----------------------------------------------- |
| PROGRAM-001 | `/app/habits/programs` | Full page           | 1440, 1024, 390    | Premium program catalogue                       |
| PROGRAM-002 | Program detail         | Full page or drawer | 1440, 390          | Program purpose, structure, and requirements    |
| PROGRAM-003 | Three-day simulation   | Full page flow      | 1440, 390          | Preview without creating real records           |
| PROGRAM-004 | Simulation day         | Full-page state     | Desktop and mobile | One simulated day and decision                  |
| PROGRAM-005 | Simulation result      | Full-page result    | Desktop and mobile | Explain what Premium would add                  |
| PROGRAM-006 | Start program          | Confirmation dialog | Desktop and mobile | Create real program only with valid entitlement |

Operational states:

```text
Default
Loading
Error
Premium locked
Trial active
Entitlement verification pending
```

---

# 16. Subscription and Entitlements

| ID      | Route or surface               | Type                            | Required frames    | Description                                     |
| ------- | ------------------------------ | ------------------------------- | ------------------ | ----------------------------------------------- |
| SUB-001 | `/pricing`                     | Public full page                | 1440, 390          | Guest, Free, and Premium comparison             |
| SUB-002 | `/app/subscription/plans`      | Application full page           | 1440, 1024, 390    | Monthly and annual plan selection               |
| SUB-003 | Checkout confirmation          | Dialog or provider handoff page | Desktop and mobile | Confirm selected plan before checkout           |
| SUB-004 | `/app/subscription/processing` | Processing page                 | 1440, 390          | Verify entitlement after checkout return        |
| SUB-005 | `/app/subscription`            | Full page                       | 1440, 1024, 390    | Current plan, renewal, trial, and management    |
| SUB-006 | Change plan                    | Dialog or full page             | Desktop and mobile | Monthly-to-annual or annual-to-monthly change   |
| SUB-007 | Cancel renewal                 | Confirmation dialog             | Desktop and mobile | Explain consequence without manipulative copy   |
| SUB-008 | `/app/subscription/resolve`    | Full page                       | 1440, 390          | Resolve active habits after downgrade or expiry |
| SUB-009 | Refunded or revoked            | Account state                   | Desktop and mobile | Explain entitlement change and preserved data   |

Operational states:

```text
Default
Loading
Processing
Verification pending
Error
Offline
Trial active
Grace period
Expired
Revoked
```

Never show Premium as active only because checkout returned successfully. Processing must communicate backend verification.

---

# 17. Settings, Account, Privacy, and Data

## 17.1 Settings

| ID           | Route or surface          | Type              | Required frames    | Description                                              |
| ------------ | ------------------------- | ----------------- | ------------------ | -------------------------------------------------------- |
| SETTINGS-001 | `/app/settings`           | Full page         | 1440, 1024, 390    | Settings overview                                        |
| SETTINGS-002 | General settings          | Full-page section | Desktop and mobile | Time zone, language, week start, and display preferences |
| SETTINGS-003 | Privacy settings          | Full-page section | Desktop and mobile | Analytics and cookie choices                             |
| SETTINGS-004 | Local storage information | Inline section    | Desktop and mobile | Guest browser-local explanation                          |

## 17.2 Account

| ID          | Route or surface        | Type                | Required frames    | Description                                  |
| ----------- | ----------------------- | ------------------- | ------------------ | -------------------------------------------- |
| ACCOUNT-001 | `/app/account`          | Full page           | 1440, 1024, 390    | Profile and account state                    |
| ACCOUNT-002 | `/app/account/security` | Full page           | 1440, 390          | Active sessions and sign-out controls        |
| ACCOUNT-003 | Sign out                | Confirmation dialog | Desktop and mobile | Explain local pending changes where relevant |

## 17.3 Export and deletion

| ID       | Route or surface                  | Type                       | Required frames    | Description                                   |
| -------- | --------------------------------- | -------------------------- | ------------------ | --------------------------------------------- |
| DATA-001 | `/app/account/export`             | Full page                  | 1440, 390          | Export cloud-backed account data              |
| DATA-002 | Export Guest data                 | Dialog or settings section | Desktop and mobile | Export browser-local Guest data               |
| DATA-003 | Clear Guest data                  | Destructive confirmation   | Desktop and mobile | Explain permanent local deletion              |
| DATA-004 | `/app/account/delete`             | Full page                  | 1440, 390          | Account deletion explanation and confirmation |
| DATA-005 | Delete account final confirmation | Destructive dialog         | Desktop and mobile | Strong explicit irreversible confirmation     |
| DATA-006 | Deletion requested                | Confirmation state         | 1440, 390          | Explain current status and sign-out behavior  |

Operational states:

```text
Default
Loading
Error
Offline
Disabled
Export processing
Export ready
Destructive confirmation
Deletion processing
```

---

# 18. Review Hub and Decisions

| ID      | Route or surface                 | Type        | Required frames    | Description                                                     |
| ------- | -------------------------------- | ----------- | ------------------ | --------------------------------------------------------------- |
| HUB-001 | `/app/review`                    | Full page   | 1440, 1024, 390    | Recovery, Weekly Review, Check-in Review, and pending decisions |
| HUB-002 | Review queue item                | Inline card | Desktop and mobile | One unresolved review action                                    |
| HUB-003 | `/app/review/check-in/[habitId]` | Full page   | 1440, 390          | Review repeated Minimum or Skipped patterns                     |
| HUB-004 | `/app/review/decisions`          | Full page   | 1440, 390          | Pending habit, Premium, and entitlement decisions               |

Operational states:

```text
Default
Empty
Loading
Error
Offline
Pending sync
Decision required
```

---

# 19. Public Website

Generate public pages only after the application core is approved.

| ID         | Route           | Required frames | Description                                                           |
| ---------- | --------------- | --------------- | --------------------------------------------------------------------- |
| PUBLIC-001 | `/`             | 1440, 390       | Landing page with product promise, benefits, product preview, and CTA |
| PUBLIC-002 | `/how-it-works` | 1440, 390       | Design, Do, Check-in, Identify friction, Adapt, Recover               |
| PUBLIC-003 | `/pricing`      | 1440, 390       | Guest, Free, and Premium comparison                                   |
| PUBLIC-004 | `/help`         | 1440, 390       | Help categories and support path                                      |
| PUBLIC-005 | `/status`       | 1440, 390       | Service availability and incident history                             |
| PUBLIC-006 | `/privacy`      | 1440, 390       | Privacy policy layout                                                 |
| PUBLIC-007 | `/terms`        | 1440, 390       | Terms of service layout                                               |
| PUBLIC-008 | `/cookies`      | 1440, 390       | Cookie and storage disclosure                                         |
| PUBLIC-009 | `/refunds`      | 1440, 390       | Refund and cancellation policy                                        |
| PUBLIC-010 | Not found       | 1440, 390       | Recoverable public 404 page                                           |

Public pages use the public header and footer, not the application sidebar.

---

# 20. Global Operational-State Components

These are reusable components, not separate full-page redesigns.

| ID        | Component                    | Purpose                                                       |
| --------- | ---------------------------- | ------------------------------------------------------------- |
| STATE-001 | Global offline banner        | Explain that network access is unavailable                    |
| STATE-002 | Pending-sync banner          | Explain locally saved changes waiting for synchronization     |
| STATE-003 | Synchronization error banner | Explain failed synchronization and Retry action               |
| STATE-004 | Session-expired dialog       | Request sign-in while preserving destination                  |
| STATE-005 | Authorization error          | Explain unavailable action and safe destination               |
| STATE-006 | Not-found state              | Explain missing or inaccessible resource                      |
| STATE-007 | Unexpected-error boundary    | Supportive message, Retry, and safe navigation                |
| STATE-008 | Conflict-resolution panel    | Compare local and latest versions with explicit choices       |
| STATE-009 | Premium-locked card          | Explain locked enhancement and plan path                      |
| STATE-010 | Destructive confirmation     | Explain item, consequence, reversibility, Cancel, and Confirm |
| STATE-011 | Loading skeleton set         | Preserve original layout dimensions                           |
| STATE-012 | Empty-state set              | Explain why content is absent and provide relevant action     |
| STATE-013 | Disabled-control explanation | Explain why an action is unavailable                          |
| STATE-014 | Success confirmation         | Confirm outcome without unnecessary animation                 |

---

# 21. Required State Matrix

`Default` means the approved original design in normal operation.

| Screen group     | Default |           Empty |            Loading | Error |            Offline |           Pending sync |          Conflict |    Premium locked |        Disabled | Destructive confirmation |
| ---------------- | ------: | --------------: | -----------------: | ----: | -----------------: | ---------------------: | ----------------: | ----------------: | --------------: | -----------------------: |
| Today            |     Yes |             Yes |                Yes |   Yes |                Yes |                    Yes |                No |                No |              No |                       No |
| Habits list      |     Yes |             Yes |                Yes |   Yes |                Yes |                    Yes |                No | Limit notice only |              No |           Lifecycle only |
| Create Habit     |     Yes |              No |        Submit only |   Yes |                Yes |        Final step only |                No |                No |             Yes |       Draft discard only |
| Habit Detail     |     Yes |              No |                Yes |   Yes |                Yes |                    Yes |               Yes |                No | Action-specific |                      Yes |
| Check-in         |     Yes |              No |        Submit only |   Yes |                Yes |                    Yes |               Yes |                No |             Yes |                       No |
| Recovery         |     Yes | Result-specific |                Yes |   Yes |                Yes |                    Yes |                No |  Enhancement only | Action-specific |                       No |
| Weekly Review    |     Yes |             Yes |                Yes |   Yes |                Yes |                    Yes |     Edit-specific |  Enhancement only | Action-specific |       Batch confirmation |
| Authentication   |     Yes |              No |                Yes |   Yes |                Yes |                     No |       Guest merge |                No | Submit-specific |                       No |
| Reminders        |     Yes |             Yes |                Yes |   Yes |                Yes | Configuration-specific |                No |  Enhancement only |             Yes |     Delete reminder only |
| Insights         |     Yes |             Yes |                Yes |   Yes |        Cached data |                     No |                No |               Yes |              No |                       No |
| Programs         |     Yes |              No |                Yes |   Yes |            Limited |                     No |                No |               Yes | Action-specific |       Start confirmation |
| Subscription     |     Yes |              No |                Yes |   Yes |                Yes |   Verification pending |                No |    Not applicable | Action-specific |             Cancellation |
| Settings         |     Yes |              No |                Yes |   Yes |                Yes | Configuration-specific | Conflict-specific |                No |             Yes |             Data actions |
| Export           |     Yes |              No |                Yes |   Yes | Block cloud export |                     No |                No |                No |             Yes |                       No |
| Account deletion |     Yes |              No |                Yes |   Yes |      Block request |                     No |                No |                No |             Yes |                      Yes |
| Public website   |     Yes |  Not applicable | Page skeleton only |   Yes |    Browser default |                     No |                No |      Pricing only |              No |                       No |

Do not generate every operational state for every screen.

---

# 22. Prototype Connections

## 22.1 Core habit loop

```text
Today
→ Select session
→ Full / Minimum / Skipped
→ Optional friction reason
→ Check-in confirmation
→ Updated Today
```

## 22.2 Habit creation

```text
Today or Habits
→ Add Habit
→ Basic Information
→ Schedule and Minimum
→ Review
→ Create
→ Habit Detail
```

## 22.3 Recovery

```text
Repeated scheduled Manual Skipped sessions
→ Recovery introduction
→ Recommendation
→ Apply or Customize
→ Recovery progress
→ Recovery result
→ Normal habit flow or Needs Review
```

## 22.4 Weekly Review

```text
Review hub
→ Weekly Review
→ Outcome summary
→ Friction summary
→ Apply / Customize / Keep Current
→ Batch confirmation
→ Completion
```

## 22.5 Guest conversion

```text
Contextual account prompt
→ Sign in or create account
→ Guest transfer preview
→ Limit or merge resolution when required
→ Transfer processing
→ Cloud-backed account confirmation
```

## 22.6 Subscription

```text
Premium preview or plan page
→ Select monthly or annual
→ Checkout confirmation
→ Provider checkout
→ Processing and backend verification
→ Premium active or recoverable error
```

---

# 23. Stitch Generation Rules

For every generated screen:

- use `DESIGN.md` as the visual authority;
- use layout ID `12495258549845976462` for the application shell;
- preserve the same icon library and stroke style;
- preserve the same navigation labels and order;
- use the correct active navigation item;
- preserve content when generating an operational variant;
- preserve component dimensions to reduce layout shifting;
- do not replace existing approved content with reference-screen content;
- do not introduce dark mode;
- do not introduce mobile-native navigation patterns;
- do not use red for ordinary Skipped, Minimum, Recovery, or empty states;
- do not use shame, streak punishment, diagnostic language, or manipulative urgency;
- do not rely on color alone;
- do not generate implementation code unless explicitly requested during handoff.

---

# 24. Screen Naming Convention

Use these names in Stitch and exported design assets:

```text
[GROUP]-[NUMBER] — [Screen Name] — [Viewport] — [State]
```

Examples:

```text
TODAY-001 — Today Dashboard — Desktop 1440 — Default
TODAY-001 — Today Dashboard — Mobile 390 — Offline
CREATE-002 — Create Habit Schedule — Mobile 390 — Validation Error
DETAIL-001 — Habit Detail — Desktop 1440 — Conflict
REVIEW-001 — Weekly Review — Mobile 390 — Empty
```

Do not create unnamed screens such as `Screen 1`, `Copy`, or `Final Final`.

---

# 25. Approval Gates

Do not continue automatically from one phase to the next.

## Gate 1 — Design system

Approve:

- colors;
- typography;
- spacing;
- icons;
- components;
- navigation;
- operational-state patterns.

## Gate 2 — Application shell

Approve:

- layout ID alignment;
- desktop sidebar;
- mobile navigation;
- page header;
- content width;
- responsive behavior.

## Gate 3 — Core Default screens

Approve:

- Today;
- Create Habit;
- Habit Detail;
- Check-in;
- Recovery;
- Weekly Review.

## Gate 4 — Operational states

Approve only the states listed in the Required State Matrix.

## Gate 5 — Secondary screens

Approve:

- authentication;
- reminders;
- insights;
- programs;
- subscription;
- settings;
- public pages.

## Gate 6 — Final audit

Confirm:

- layout consistency;
- icon consistency;
- responsive consistency;
- accessibility;
- content preservation;
- operational-state preservation;
- prototype connections.

---

# 26. Definition of Stitch-Ready

The screen inventory is ready for Stitch when:

- `STITCH-BRIEF.md` is attached;
- `DESIGN.md` is attached;
- this inventory is attached;
- the approved visual-direction image is attached;
- layout ID `12495258549845976462` is accessible;
- screen generation begins with the design system and application shell;
- screens are generated in small batches;
- operational states are generated only after Default screens are approved;
- the final designs can be exported to Antigravity without changing the approved structure.

---

# End of Screen Inventory
