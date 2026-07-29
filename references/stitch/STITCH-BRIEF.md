# Recovery-First Habit Tracker

## Google Stitch Product and UI/UX Brief

| Field                          | Value                                   |
| ------------------------------ | --------------------------------------- |
| Document status                | Approved design input for Google Stitch |
| Version                        | 1.0                                     |
| Prepared                       | 30 July 2026                            |
| Product stage                  | Greenfield / pre-development            |
| Primary platform               | Responsive website and installable PWA  |
| Theme scope                    | Light theme for MVP                     |
| Business model                 | Freemium SaaS                           |
| Authoritative layout reference | Stitch layout ID `12495258549845976462` |

---

# 1. Purpose of This Brief

This document gives Google Stitch the minimum authoritative product context required to design the Recovery-First Habit Tracker website.

Use this brief to understand:

- what the product is;
- who it serves;
- what the core interaction model is;
- which screens matter most;
- how navigation must behave;
- which visual direction must be preserved;
- which operational states are required;
- what the product must never communicate.

This document is not a technical implementation plan. Do not infer database architecture, backend logic, payment-provider behavior, or code structure from it.

---

# 2. Product Summary

Recovery-First Habit Tracker is a responsive web SaaS product that helps people create, maintain, adapt, and recover habits without punitive streak mechanics.

The product is designed for people who struggle with:

- starting habits that are too ambitious;
- maintaining routines during low-energy or busy periods;
- returning after several missed sessions;
- understanding why a habit is difficult;
- changing a habit without losing prior progress.

The product must make recovery feel normal, structured, and manageable.

## 2.1 Core product promise

The system does not punish imperfect execution. It preserves history, recognizes friction, recommends the smallest useful adjustment, and gives the user final control over every meaningful change.

## 2.2 Core loop

```text
Design
→ Do
→ Check-in
→ Identify friction
→ Adapt
→ Recover
```

## 2.3 Primary differentiation

Traditional habit trackers often emphasize streak preservation and failure avoidance.

This product emphasizes:

- continuity without shame;
- Full and Minimum success outcomes;
- optional friction capture;
- transparent adaptation;
- guided Recovery Plans;
- preserved history after redesign;
- user-approved recommendations.

---

# 3. Primary User

The primary user is an individual who wants to build sustainable habits but may experience inconsistent energy, changing schedules, interruptions, or difficulty returning after a lapse.

The user may prefer to try the product anonymously before creating an account.

The interface must support users who:

- are starting their first habit;
- need a smaller version for difficult days;
- want a fast daily check-in;
- need help understanding repeated friction;
- are returning after several missed sessions;
- want progress information without judgment;
- may temporarily lose internet access.

---

# 4. Product Principles

## 4.1 Recovery over punishment

Do not erase, diminish, or visually shame prior effort because of a missed session.

## 4.2 Minimum is success

A Minimum check-in is a successful continuity outcome. It must never look like partial failure, weakness, or an inferior completion.

## 4.3 User control

Recommendations that change a habit must support:

```text
Apply
Customize
Keep Current
```

No recommendation is silently applied.

## 4.4 Smallest useful change

Recovery and adaptation should change one meaningful variable at a time.

## 4.5 Explainability

Every recommendation should explain:

- what signal was observed;
- why it matters;
- what change is recommended;
- when the change begins.

## 4.6 Progressive disclosure

Show only the information needed for the current decision. Advanced information should appear in contextual drawers, dialogs, expandable sections, or dedicated routes.

## 4.7 Browser honesty

Clearly communicate whether data is:

- stored only in this browser;
- saved locally;
- pending synchronization;
- synchronized;
- unavailable offline;
- waiting for server verification.

---

# 5. User-Facing Terminology

Use these terms consistently:

| Concept                           | Approved label                            |
| --------------------------------- | ----------------------------------------- |
| Normal completion                 | `Full`                                    |
| Minimum completion                | `Minimum`                                 |
| User-recorded miss                | `Skipped`                                 |
| Automatically unresolved session  | `Skipped — not recorded`                  |
| Temporary recovery workflow       | `Recovery plan`                           |
| Habit requiring a larger decision | `Needs Review`                            |
| Browser-only guest data           | `Stored only in this browser`             |
| Local unsynchronized change       | `Saved on this browser — waiting to sync` |

Avoid:

- failure language for Minimum;
- broken-streak language;
- shame-based warnings;
- diagnostic psychological labels;
- aggressive urgency;
- manipulative subscription language.

---

# 6. User States and Product Limits

| User state   | Active-habit limit | Storage model | Main value                                             |
| ------------ | -----------------: | ------------- | ------------------------------------------------------ |
| Guest        |                  3 | Browser-local | Try the full core habit loop without an account        |
| Free account |                  5 | Cloud-backed  | Backup and basic cross-device continuity               |
| Premium      |                 20 | Cloud-backed  | Programs, advanced insights, and adaptive capabilities |

The design must not make Guest or Free feel unusable. Core habit creation, check-ins, basic Recovery, and history preservation remain meaningful without Premium.

---

# 7. Information Architecture

## 7.1 Desktop and laptop navigation

At widths of 1024 px and above, use a persistent left sidebar.

Primary destinations:

```text
Today
Habits
Review
Insights
More or supporting destinations where required
```

Supporting destinations may include:

```text
Reminders
Settings
Subscription
Help
Account
```

## 7.2 Tablet and mobile-web navigation

Below 1024 px, use a bottom navigation bar:

```text
Today | Habits | Review | Insights | More
```

`More` opens a full-height drawer or equivalent responsive surface containing supporting destinations.

## 7.3 Authoritative application shell

Use Stitch layout ID `12495258549845976462` as the authoritative reference for:

- application shell;
- sidebar dimensions;
- bottom navigation;
- page-header structure;
- content width;
- grid composition;
- navigation order;
- icon style;
- spacing density;
- shared component styling;
- responsive behavior.

When updating an existing screen to this layout:

- preserve its content;
- preserve its current operational state;
- preserve its functionality;
- update only shared visual structure and component consistency.

---

# 8. Visual Direction

## 8.1 Design personality

The interface must feel:

- calm;
- clear;
- supportive;
- contemporary;
- practical;
- lightly optimistic;
- spacious but not empty;
- professional enough for long-term use.

## 8.2 Visual language

Use:

- emerald green for primary navigation and primary actions;
- white cards;
- soft gray-green page backgrounds;
- subtle borders;
- restrained shadows;
- rounded rectangular cards and controls;
- small consistent line icons;
- direct labels on charts;
- restrained semantic accent colors;
- limited illustration use.

## 8.3 Primary emerald palette

Use the approved emerald system from `UI-SPEC.md`.

Key values include:

| Token         | Value     | Use                                   |
| ------------- | --------- | ------------------------------------- |
| `emerald-800` | `#106038` | Strong selected emphasis              |
| `emerald-700` | `#106838` | Dark primary and focus treatment      |
| `emerald-600` | `#187040` | Primary hover                         |
| `emerald-500` | `#288848` | Primary action and progress           |
| `emerald-200` | `#A0C8B0` | Positive borders and disabled accents |
| `emerald-100` | `#DDEFE4` | Selected navigation background        |
| `emerald-50`  | `#F0F7F3` | Selected and positive surface         |

## 8.4 Semantic accents

Use semantic accents with restraint:

- emerald for primary actions, completion, and positive continuity;
- amber for Minimum emphasis, warnings, and careful attention where specified;
- purple for Recovery Plans;
- blue for informational states;
- coral or red only for actual errors and destructive actions;
- gold for Premium highlights;
- neutral gray for ordinary secondary information.

Do not use red as the default treatment for Skipped, Recovery, or ordinary difficulty.

## 8.5 Theme scope

Create one complete light theme for MVP.

Do not introduce a dark theme unless explicitly requested in a later design phase.

---

# 9. Typography, Icons, and Components

## 9.1 Typography

Use one consistent modern sans-serif family with:

- clear page titles;
- readable body text;
- compact but legible labels;
- consistent line height;
- strong hierarchy without oversized marketing typography inside the application.

## 9.2 Icons

Use one consistent line-icon library.

All screens must preserve the same:

- icon family;
- stroke width;
- corner style;
- visual weight;
- size system;
- alignment;
- semantic usage.

Do not mix outlined, filled, rounded, or unrelated icon systems.

Important actions must include visible text labels or accessible names. Do not rely on icons alone.

## 9.3 Shared components

Create reusable visual patterns for:

- primary, secondary, tertiary, and destructive buttons;
- icon buttons;
- text inputs;
- textareas;
- selects;
- checkboxes;
- radio groups;
- switches;
- cards;
- session cards;
- recommendation cards;
- status badges;
- banners;
- dialogs;
- drawers;
- dropdown menus;
- tooltips;
- tabs;
- progress indicators;
- skeletons;
- empty states;
- error states;
- offline and pending-sync states;
- conflict resolution;
- Premium-locked states;
- destructive confirmations.

---

# 10. Core Screens and Priority

Design the product in controlled batches. Do not generate every screen simultaneously.

## Batch 1 — Foundation

1. Design-system board.
2. Responsive application shell.
3. Today Dashboard — Default state.

## Batch 2 — Habit setup and management

1. Create Habit — Basic Information.
2. Create Habit — Schedule and Minimum.
3. Create Habit — Review and Create.
4. Habit Details.

## Batch 3 — Daily check-in flow

1. Check-in choice.
2. Optional Friction Reason.
3. Check-in Confirmation.
4. Updated Today Dashboard.

## Batch 4 — Adaptation and recovery

1. Recovery Plan.
2. Recovery progress.
3. Recovery result.
4. Needs Review.
5. Weekly Review.

## Batch 5 — Secondary product areas

1. Habits list.
2. Review hub.
3. Insights.
4. Reminders.
5. Settings.
6. Subscription.
7. Authentication and Guest conversion.
8. Public landing and pricing pages.

---

# 11. Core Screen Requirements

## 11.1 Today Dashboard

The Today screen is the primary daily workspace.

It should include:

- greeting or contextual page heading;
- current date;
- daily progress summary;
- scheduled session cards;
- Normal and Minimum action summaries;
- direct `Full`, `Minimum`, and `Skipped` actions;
- pending Check-in Review or Recovery attention where relevant;
- clear local/offline/sync status where relevant;
- a visible Add Habit action.

Daily actions must remain visible without horizontal scrolling or hidden menus.

## 11.2 Create Habit

Create Habit is a three-screen flow:

1. Basic Information.
2. Schedule and Minimum.
3. Review and Create.

The flow must:

- preserve entered data when navigating backward;
- explain that Minimum is a successful continuity outcome;
- show progress without making the form feel long;
- use clear Continue, Back, Save Draft, and Create actions where appropriate;
- support Disabled, Error, and Offline variants.

## 11.3 Habit Details

Habit Details should include:

- habit name and current lifecycle state;
- Normal and Minimum definitions;
- schedule;
- reminders summary;
- recent sessions;
- continuity and consistency summary;
- Recovery status where applicable;
- version history;
- edit, pause, stop, archive, and destructive actions where permitted.

## 11.4 Check-in

The check-in interaction must make all three outcomes understandable:

```text
Full
Minimum
Skipped
```

Minimum must receive positive, respectful treatment.

Skipped must remain available without becoming visually dominant or punitive.

## 11.5 Friction Reason

After `Skipped`, offer one optional friction reason.

The surface should:

- be quick to complete;
- allow dismissal or no reason;
- avoid diagnostic interpretation;
- support one primary reason and optional note where specified;
- preserve context from the original session.

## 11.6 Recovery Plan

Recovery begins after three consecutive scheduled Manual Skipped sessions for the same habit.

The initial Recovery Plan:

- lasts three scheduled sessions by default;
- recommends one smaller or simpler adjustment;
- uses purple accents with emerald completion states;
- explains the observed signal and expected benefit;
- supports Apply, Customize, and Keep Current;
- does not block unrelated habits or navigation.

## 11.7 Weekly Review

Weekly Review should summarize:

- successful sessions;
- Full and Minimum distribution;
- relevant Skipped patterns;
- friction themes;
- Recovery or At Risk items;
- one explained recommendation at a time.

Recommendation actions:

```text
Apply
Customize
Keep Current
```

---

# 12. Operational States

The Default state is the approved original screen under normal conditions.

Create operational states only where relevant to the screen. Do not force every state onto every screen.

Possible states include:

```text
Default
Empty
Loading
Error
Offline
Pending sync
Conflict
Premium locked
Disabled
Destructive confirmation
```

## 12.1 State consistency rules

Every operational-state variant must preserve the Default screen's:

- page layout;
- application shell;
- navbar;
- active navigation item;
- icons;
- content width;
- grid;
- cards;
- typography;
- spacing;
- borders;
- shadows;
- radius;
- responsive behavior;
- original content where the state does not require replacement.

Make only the smallest state-specific change required.

Minimize layout shifting between variants.

## 12.2 State communication

Do not rely on color alone.

Use appropriate combinations of:

- icons;
- headings;
- status labels;
- descriptions;
- inline messages;
- actions;
- screen-reader announcements.

---

# 13. Responsive Requirements

Generate and review important screens at:

```text
Desktop: 1440 px
Tablet: 1024 px
Mobile: 390 px
```

Also ensure layouts remain usable at widths down to 360 px.

## 13.1 Desktop

Use:

- persistent left sidebar;
- central content container;
- two- or three-column layouts only where readability remains strong;
- stable page headers;
- contextual secondary panels only when useful.

## 13.2 Tablet

Use:

- bottom navigation;
- compact header;
- one- or two-column composition;
- appropriately resized dialogs or drawers.

## 13.3 Mobile web

Use:

- bottom navigation;
- compact top header;
- single-column content;
- full-width cards where appropriate;
- drawers or full-screen dialogs instead of cramped desktop modals;
- primary actions that remain easy to reach.

Do not merely shrink the desktop screen. Recompose content while preserving hierarchy and functionality.

---

# 14. Accessibility Requirements

Every design must support:

- keyboard navigation;
- visible focus indicators;
- logical focus order;
- semantic headings;
- accessible control labels;
- sufficient text and control contrast;
- status communication beyond color;
- touch-friendly target sizes;
- layout reflow at 200% zoom;
- reduced-motion preferences;
- screen-reader-friendly state changes;
- meaningful error identification and recovery actions.

Full, Minimum, and Skipped must be distinguishable by text and structure, not color alone.

---

# 15. Content and Tone

Use language that is:

- calm;
- direct;
- specific;
- supportive;
- non-clinical;
- non-judgmental;
- action-oriented.

Preferred examples:

```text
Minimum still counts toward continuity.
Saved on this browser — waiting to sync.
Review a lighter plan.
Choose what happens next.
We could not load this section. Try again.
```

Avoid:

```text
You failed.
Your streak is broken.
You lost all progress.
You must recover now.
You are unmotivated.
Only Premium users can succeed.
```

---

# 16. Strict Design Restrictions

Do not:

- use punitive streak mechanics;
- use broken-chain or failure imagery as the primary model;
- use red as the default treatment for Skipped;
- make Minimum look inferior to Full;
- silently redesign a habit;
- preselect recommendation decisions;
- create mobile-native Android or iOS patterns;
- introduce a different navbar between screens;
- mix icon libraries;
- redesign approved content when generating a system state;
- change a screen's operational state during a consistency update;
- remove offline, sync, or conflict information;
- introduce dark mode;
- add social feeds, leaderboards, competitive rankings, or public streaks;
- use manipulative countdowns or deceptive Premium hierarchy;
- create unrelated illustrations or decorative elements;
- simplify away important user-control actions.

---

# 17. Stitch Working Method

Google Stitch should follow this sequence:

1. Read this brief and all attached design references.
2. Summarize product understanding before generating screens.
3. Create the design-system board.
4. Create the responsive application shell.
5. Generate the Today Dashboard Default screen.
6. Refine and approve the Default layout.
7. Build screen batches sequentially.
8. Generate relevant operational states only after each Default screen is approved.
9. Audit navbar, icons, spacing, typography, colors, and responsive behavior.
10. Preserve approved content and states during consistency updates.
11. Prepare the approved project for Antigravity implementation.

---

# 18. Reference Authority

Use the following authority order:

1. `STITCH-BRIEF.md` for product intent and design scope.
2. `DESIGN.md` for visual tokens and shared design rules.
3. Stitch layout ID `12495258549845976462` for the authoritative application shell.
4. `SCREEN-INVENTORY.md` for required screen coverage.
5. `UX-FLOWS.md` for navigation and interaction behavior.
6. `UI-SPEC.md` for detailed component, state, responsive, and accessibility requirements.
7. Approved screen variants for content and state-specific visual reference.

When sources appear inconsistent:

- preserve product behavior from `UX-FLOWS.md`;
- preserve visual tokens from `DESIGN.md` and `UI-SPEC.md`;
- preserve the shared application shell from layout ID `12495258549845976462`;
- preserve the current screen's content and operational state during layout-alignment work.

---

# 19. Definition of a Successful Stitch Output

A successful Stitch project must provide:

- one consistent design system;
- one consistent icon system;
- one authoritative responsive application shell;
- approved desktop, tablet, and mobile compositions;
- complete core-loop screens;
- relevant operational states;
- clear Recovery and Weekly Review flows;
- non-punitive content;
- accessible state communication;
- reusable components;
- no visible inconsistency between screens;
- a clean handoff path to Antigravity for Next.js implementation.
