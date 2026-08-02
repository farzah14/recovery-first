# Recovery-First Habit Tracker

## Website UI Specification

**Document type:** Product design and implementation specification  
**Platform:** Responsive website only  
**Product stage:** Greenfield  
**Theme scope:** Light theme for MVP  
**Design reference:** Approved website overview visual  
**Source-of-truth dependencies:**

1. `docs/specs/PRD.md`
2. `docs/specs/UX-FLOWS.md`
3. This document
4. Approved Figma frames and component definitions

---

# Document Map

1. Purpose and authority
2. Product UI principles
3. Visual direction
4. Responsive platform standards
5. Information architecture
6. Color system
7. Typography
8. Spacing, grids, shape, elevation, and motion
9. Icons, illustrations, and data visualization
10. Global website shell
11. Core component system
12. Form and input patterns
13. Feedback, state, and system-status patterns
14. Public website screens
15. Authentication and application-entry screens
16. Today and daily check-in screens
17. Habits and habit-detail screens
18. Recovery and Weekly Review screens
19. Insights screens
20. Reminders screens
21. Settings, profile, and data-management screens
22. Subscription screens
23. Responsive behavior
24. Accessibility requirements
25. Content and tone rules
26. Required state matrix
27. Design handoff and implementation contract
28. UI acceptance checklist

---

# 1. Purpose and Design Authority

This document defines the visual system, responsive layout rules, reusable components, interaction states, and screen-level requirements for the Recovery-First Habit Tracker website.

The product is a responsive web application. It must feel complete on desktop, laptop, tablet, and mobile browsers without treating the mobile layout as a compressed desktop screen.

When requirements conflict, use this order:

1. Explicit product requirement in `PRD.md`
2. Explicit flow requirement in `UX-FLOWS.md`
3. Explicit component or visual requirement in this document
4. Approved Figma component and frame
5. Existing implementation pattern

A visual implementation must not override product behavior. A Figma frame must not silently change entitlement, data, authentication, recovery, or check-in rules.

---

# 2. Product UI Principles

## 2.1 Recovery-first, not punishment-first

The interface must help the user continue after difficulty. It must not use shame, aggressive red states, broken-chain imagery, or streak-loss language as the primary feedback model.

Use:

- calm acknowledgment;
- specific next actions;
- flexible continuity;
- recovery-oriented language;
- neutral treatment of missed or unrecorded sessions;
- visible user control.

Avoid:

- guilt-based copy;
- celebratory fire as the sole success signal;
- red as the default color for Skipped;
- destructive visual emphasis on ordinary habit difficulty;
- confetti for every routine action;
- forced positivity.

## 2.2 Fast daily execution

The Today experience must support a check-in with minimal navigation. Primary daily actions remain visible without horizontal scrolling or hidden menus.

Targets:

- Full and Minimum check-ins available directly from the habit card;
- Skipped available without being visually dominant;
- one clear primary action per panel;
- common daily actions reachable within one page transition;
- form progress preserved when the user navigates back or loses connectivity.

## 2.3 Progressive disclosure

The default screen shows only the information needed for the current decision. Advanced details appear in drawers, expandable regions, tabs, or dedicated pages.

Examples:

- friction reasons appear after Skipped;
- version history appears within Habit Detail;
- reminder delivery details appear in Reminders or Settings;
- plan comparison appears after a Premium CTA;
- technical sync information appears only when action is required.

## 2.4 User control

The user must understand what will happen before:

- changing a habit materially;
- creating a new habit version;
- applying a recommendation;
- enabling browser notifications;
- recovering legacy local data;
- confirming a subscription;
- cancelling renewal;
- exporting or deleting data.

## 2.5 Clear source and timing

The interface must distinguish:

- saved locally;
- pending synchronization;
- synchronized;
- server verification pending;
- scheduled reminder;
- delivered reminder;
- account-level entitlement;
- browser permission state.

## 2.6 Accessible by default

All controls must support keyboard use, visible focus, semantic labels, sufficient contrast, zoom, text reflow, and screen-reader output. Color may reinforce meaning but must never be the only indicator.

---

# 3. Visual Direction

## 3.1 Design personality

The approved website direction is:

- clean;
- calm;
- contemporary;
- supportive;
- practical;
- lightly optimistic;
- spacious without appearing empty;
- professional enough for long-term self-management.

## 3.2 Visual language

The system uses:

- white cards over soft gray-green page backgrounds;
- emerald green for primary navigation and positive actions;
- subtle borders rather than heavy shadows;
- rounded rectangular cards;
- restrained accent colors;
- small line icons;
- compact charts with direct labels;
- clear section headers;
- simple circular progress indicators;
- limited illustration use.

## 3.3 Theme scope

MVP provides one complete light theme.

Dark theme is outside MVP scope. Components must use semantic tokens so a later dark theme can be introduced without rewriting component APIs.

## 3.4 Visual density

Desktop uses comfortable information density. Cards may appear in two- or three-column layouts where content remains readable.

Mobile uses a single-column flow. Important actions must not depend on hover.

---

# 4. Responsive Platform Standards

## 4.1 Breakpoints

| Name | Width | Primary navigation | Content behavior |
|---|---:|---|---|
| Mobile | 360–767 px | Bottom navigation | Single column |
| Tablet | 768–1023 px | Bottom navigation with compact header | One or two columns |
| Laptop | 1024–1439 px | Left sidebar | Two-column capable |
| Desktop | 1440 px and above | Left sidebar | Two- or three-column capable |

Layouts must also remain usable from 320 px to 359 px, but 360 px is the primary mobile design frame.

## 4.2 Reference frames

Use these Figma frames:

```text
Mobile:   390 × 844
Tablet:   834 × 1112
Laptop:   1280 × 800
Desktop:  1440 × 1024
Wide:     1728 × 1117
```

## 4.3 Application viewport

The application shell must support:

- browser zoom from 80% through 200%;
- text zoom without clipped controls;
- viewport height changes caused by mobile browser chrome;
- safe-area insets on supported mobile browsers;
- keyboard opening without hiding the active field;
- browser back and forward navigation.

## 4.4 Pointer and keyboard targets

Minimum interactive target:

- desktop pointer: 40 × 40 px;
- touch: 44 × 44 px;
- mobile primary actions: at least 48 px high.

Adjacent touch targets require at least 8 px separation unless contained in a segmented control designed for direct contact.

---

# 5. Information Architecture

## 5.1 Public website navigation

Public navigation contains:

```text
Logo
Features
How It Works
Pricing
Help
Sign In
Start Free
```

Desktop uses a horizontal header. Mobile uses a menu button opening a full-height navigation sheet.

## 5.2 Desktop and laptop application navigation

The persistent left sidebar contains:

```text
Today
Habits
Review
Insights
Reminders
Settings
```

The profile and subscription area appears at the bottom of the sidebar.

## 5.3 Tablet and mobile application navigation

Bottom navigation contains:

```text
Today
Habits
Review
Insights
More
```

`More` opens a navigation sheet containing:

```text
Reminders
Settings
Profile
Subscription
Help
Sign In or Sign Out
```

## 5.4 Navigation state

Every navigation item includes:

- icon;
- text label;
- selected indicator;
- keyboard focus state;
- optional count badge;
- optional action-required badge.

Do not use icon-only primary navigation.

---

# 6. Color System

The color system follows the approved website visual. All implementation must use semantic tokens rather than scattered hexadecimal values.

## 6.1 Primary emerald palette

| Token | Hex | Intended use |
|---|---|---|
| `emerald-950` | `#0A3D24` | Rare high-contrast brand text |
| `emerald-900` | `#0D522F` | Dark active and pressed states |
| `emerald-800` | `#106038` | Sidebar brand, selected emphasis |
| `emerald-700` | `#106838` | Primary dark green from approved visual |
| `emerald-600` | `#187040` | Primary button hover |
| `emerald-500` | `#288848` | Primary action and progress |
| `emerald-400` | `#309050` | Secondary positive chart series |
| `emerald-300` | `#629176` | Muted positive icon and data series |
| `emerald-200` | `#A0C8B0` | Positive borders and progress track accents |
| `emerald-100` | `#DDEFE4` | Selected navigation background |
| `emerald-50` | `#F0F7F3` | Positive and selected surface |

## 6.2 Neutral palette

| Token | Hex | Intended use |
|---|---|---|
| `neutral-950` | `#161A17` | Primary text |
| `neutral-900` | `#242A26` | Headings and strong icons |
| `neutral-800` | `#355749` | Brand-adjacent dark green-gray |
| `neutral-700` | `#4E5B54` | Secondary text |
| `neutral-600` | `#68736D` | Supporting text |
| `neutral-500` | `#7F8A84` | Placeholder and subdued metadata |
| `neutral-400` | `#9FA9A4` | Disabled icons |
| `neutral-300` | `#C4CFCD` | Strong borders and dividers |
| `neutral-200` | `#DDE5E1` | Standard borders |
| `neutral-150` | `#EBEFEF` | Soft panel border and track |
| `neutral-100` | `#F0F4F3` | Muted backgrounds |
| `neutral-50` | `#F8F9F9` | Application page background |
| `white` | `#FFFFFF` | Card and overlay surface |

## 6.3 Accent palette

| Family | Main | Soft surface | Border | Use |
|---|---|---|---|---|
| Amber | `#F59E0B` | `#FFF7E6` | `#F6D38A` | Minimum, Premium, warning |
| Coral | `#EF4444` | `#FFF1F1` | `#F3B6B6` | Error and destructive action |
| Purple | `#8B5CF6` | `#F5F0FF` | `#D9C8FA` | Recovery tools and recovery state |
| Blue | `#3B82F6` | `#EEF5FF` | `#BED5FA` | Informational and hydration-related accents |
| Cyan | `#38AFC7` | `#ECFAFC` | `#B9E5EC` | Optional secondary data series |
| Gold | `#EAB308` | `#FFF9DB` | `#F0D86C` | Premium iconography and highlight |
| Brown | `#6B4937` | `#F6F1EE` | `#D8C7BE` | Default profile avatar accent |

## 6.4 Semantic tokens

| Semantic token | Value |
|---|---|
| `color-page` | `neutral-50` |
| `color-surface` | `white` |
| `color-surface-subtle` | `neutral-100` |
| `color-surface-selected` | `emerald-50` |
| `color-text-primary` | `neutral-950` |
| `color-text-secondary` | `neutral-700` |
| `color-text-muted` | `neutral-600` |
| `color-text-disabled` | `neutral-400` |
| `color-border` | `neutral-200` |
| `color-border-strong` | `neutral-300` |
| `color-focus` | `emerald-700` |
| `color-primary` | `emerald-500` |
| `color-primary-hover` | `emerald-600` |
| `color-primary-pressed` | `emerald-700` |
| `color-primary-disabled` | `emerald-200` |
| `color-primary-surface` | `emerald-50` |
| `color-success` | `emerald-500` |
| `color-success-surface` | `emerald-50` |
| `color-minimum` | `amber` |
| `color-minimum-surface` | `#FFF7E6` |
| `color-skipped` | `neutral-600` |
| `color-skipped-surface` | `neutral-100` |
| `color-unrecorded` | `neutral-500` |
| `color-recovery` | `purple` |
| `color-recovery-surface` | `#F5F0FF` |
| `color-warning` | `#B86B00` |
| `color-warning-surface` | `#FFF7E6` |
| `color-danger` | `coral` |
| `color-danger-surface` | `#FFF1F1` |
| `color-info` | `blue` |
| `color-info-surface` | `#EEF5FF` |
| `color-premium` | `gold` |
| `color-premium-surface` | `#FFF9DB` |

## 6.5 Check-in status colors

| Check-in status | Icon | Color | Label requirement |
|---|---|---|---|
| Full | Check circle | Emerald | Always display `Full` or equivalent text in detail views |
| Minimum | Small check or leaf | Amber | Always display `Minimum` |
| Skipped | Minus circle | Neutral gray | Always display `Skipped`; do not default to red |
| Unrecorded | Open circle | Neutral gray | Always display `Unrecorded` |
| Pending sync | Rotating or queued icon | Blue | Display `Saving` or `Pending sync` |
| Sync failed | Warning icon | Coral | Display action text such as `Retry` |

## 6.6 Contrast rules

- Primary body text must meet WCAG AA contrast against its surface.
- Normal text requires at least 4.5:1.
- Large text requires at least 3:1.
- Component borders and focus indicators require at least 3:1 against adjacent colors where applicable.
- White text may be used on `emerald-500` only when verified at the final token value and font weight.
- Amber surfaces use dark neutral text, not white text.
- Purple and blue soft surfaces use dark neutral text.

## 6.7 Color usage restrictions

- Red is reserved for errors, irreversible actions, payment failure, security warnings, and destructive confirmation.
- Skipped is not inherently an error and must not use red by default.
- Recovery uses purple accents to remain visually distinct from ordinary completion.
- Premium uses gold or amber accents but must not reduce readability.
- Charts must include labels, patterns, markers, or direct values in addition to color.
- Decorative accents may not compete with the primary action.

---

# 7. Typography

## 7.1 Typeface

Primary typeface:

```text
Inter
```

Fallback stack:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif
```

The product must not require a downloadable custom display font for core usability.

## 7.2 Type scale

| Token | Desktop | Mobile | Weight | Line height | Use |
|---|---:|---:|---:|---:|---|
| `display-lg` | 48 px | 38 px | 700 | 1.1 | Public landing hero |
| `display-sm` | 40 px | 32 px | 700 | 1.15 | Public section headline |
| `heading-1` | 32 px | 28 px | 700 | 1.2 | Application page title |
| `heading-2` | 24 px | 22 px | 700 | 1.25 | Major section heading |
| `heading-3` | 20 px | 18 px | 600 | 1.3 | Card group heading |
| `heading-4` | 16 px | 16 px | 600 | 1.35 | Card title |
| `body-lg` | 16 px | 16 px | 400 | 1.6 | Introductory body copy |
| `body-md` | 14 px | 14 px | 400 | 1.55 | Default application text |
| `body-sm` | 13 px | 13 px | 400 | 1.5 | Supporting metadata |
| `label-md` | 14 px | 14 px | 600 | 1.35 | Buttons and form labels |
| `label-sm` | 12 px | 12 px | 600 | 1.35 | Badges and compact labels |
| `caption` | 12 px | 12 px | 400 | 1.45 | Non-critical supporting text |
| `metric-lg` | 36 px | 32 px | 700 | 1.1 | Key metric value |
| `metric-md` | 24 px | 22 px | 700 | 1.2 | Card metric value |

## 7.3 Typography rules

- Use sentence case for headings, buttons, navigation, and labels.
- Do not use all caps for ordinary interface text.
- Page titles remain left aligned except focused authentication and checkout states.
- Keep body lines between approximately 45 and 75 characters where practical.
- Numeric metrics use tabular numerals when supported.
- Do not reduce text below 12 px.
- Links must be visibly distinguishable by more than color on hover or focus.

---

# 8. Spacing, Grids, Shape, Elevation, and Motion

## 8.1 Spacing scale

Use a 4 px base unit.

```text
space-0  = 0
space-1  = 4 px
space-2  = 8 px
space-3  = 12 px
space-4  = 16 px
space-5  = 20 px
space-6  = 24 px
space-8  = 32 px
space-10 = 40 px
space-12 = 48 px
space-16 = 64 px
space-20 = 80 px
space-24 = 96 px
```

## 8.2 Page gutters

| Breakpoint | Horizontal gutter |
|---|---:|
| Mobile | 16 px |
| Tablet | 24 px |
| Laptop | 28 px |
| Desktop | 32 px |
| Wide | 40 px |

## 8.3 Application content width

- Standard application content: maximum 1280 px.
- Reading or form content: maximum 720 px.
- Authentication form: 400–440 px.
- Modal content: maximum 640 px unless a data comparison requires more width.
- Public landing sections: maximum 1200 px.

## 8.4 Grid

Desktop application grid:

```text
Sidebar: 240 px
Gap after sidebar: 24 px
Main content: fluid
Optional right rail: 280–320 px
```

Desktop dashboard cards use a 12-column grid with 24 px gaps.

Tablet uses an 8-column grid with 20 px gaps.

Mobile uses a 4-column grid with 16 px gaps.

## 8.5 Radius scale

| Token | Value | Use |
|---|---:|---|
| `radius-sm` | 6 px | Compact badges and controls |
| `radius-md` | 10 px | Inputs and buttons |
| `radius-lg` | 14 px | Standard cards |
| `radius-xl` | 18 px | Large panels and dialogs |
| `radius-pill` | 999 px | Chips, toggles, progress labels |

## 8.6 Border scale

- Standard border: 1 px solid `color-border`.
- Strong border: 1 px solid `color-border-strong`.
- Focus ring: 2 px `color-focus` with 2 px outer offset.
- Selected card: 1 px `emerald-300` plus `color-primary-surface` background.
- Destructive selected state: 1 px coral border plus danger surface.

## 8.7 Elevation

Prefer borders and tonal separation over shadows.

```text
shadow-0: none
shadow-1: 0 1px 2px rgba(22, 26, 23, 0.06)
shadow-2: 0 6px 18px rgba(22, 26, 23, 0.08)
shadow-3: 0 16px 40px rgba(22, 26, 23, 0.12)
```

Use:

- cards: `shadow-0` or `shadow-1`;
- dropdowns: `shadow-2`;
- dialogs and navigation sheets: `shadow-3`;
- sticky mobile navigation: subtle top border plus `shadow-1`.

## 8.8 Motion

| Token | Duration | Use |
|---|---:|---|
| `motion-fast` | 120 ms | Hover, focus, pressed |
| `motion-base` | 180 ms | Expand, collapse, tabs |
| `motion-slow` | 260 ms | Dialog and sheet entrance |

Easing:

```text
standard: cubic-bezier(0.2, 0, 0, 1)
enter:    cubic-bezier(0, 0, 0.2, 1)
exit:     cubic-bezier(0.4, 0, 1, 1)
```

Rules:

- Respect `prefers-reduced-motion`.
- Do not animate progress from zero on every page visit.
- Do not use bouncing or shaking for ordinary validation.
- Loading indicators may rotate, but must include text for long operations.
- Successful check-ins may use a subtle 180 ms state transition without confetti.

---

# 9. Icons, Illustrations, and Data Visualization

## 9.1 Icon system

Use a consistent rounded line-icon family such as Lucide.

Standard sizes:

```text
16 px  compact metadata
18 px  buttons and inputs
20 px  navigation and cards
24 px  large action or empty state
32 px  feature illustration support
```

Icons must use a 1.75–2 px stroke at 20–24 px.

## 9.2 Icon semantics

| Meaning | Suggested icon |
|---|---|
| Today | Home |
| Habits | List checks or sprout |
| Review | Clipboard check |
| Insights | Bar chart |
| Reminders | Bell |
| Settings | Settings |
| Full | Check circle |
| Minimum | Leaf or small check circle |
| Skipped | Minus circle |
| Recovery | Heart pulse, shield heart, or life buoy |
| Premium | Crown |
| Offline | Cloud off |
| Pending sync | Refresh or cloud upload |
| Edit | Pencil |
| Delete | Trash |

Do not rely on a flame icon as the primary product metaphor.

## 9.3 Illustrations

Illustrations are optional and limited to:

- public landing sections;
- empty states;
- first-time onboarding;
- Recovery introduction;
- Premium program preview.

Illustrations must use the product palette and remain secondary to actionable content.

## 9.4 Charts

Charts use:

- emerald as primary series;
- blue, purple, amber, and cyan as secondary series;
- direct values or accessible legends;
- visible axis or period labels where needed;
- no 3D effects;
- no decorative gradients that obscure values.

Minimum chart target sizes:

- compact sparkline: 120 × 40 px;
- circular metric: 88 × 88 px;
- standard chart panel: minimum 280 px wide and 180 px high.

---

# 10. Global Website Shell

## 10.1 Public header

Desktop public header:

- height: 72 px;
- sticky at top after initial scroll;
- white background;
- bottom border appears when sticky;
- logo left;
- navigation center or right;
- Sign In outlined or text action;
- Start Free primary action.

Mobile public header:

- height: 64 px;
- logo left;
- menu button right;
- no horizontal navigation overflow.

## 10.2 Application sidebar

Desktop and laptop sidebar:

- fixed or sticky left rail;
- width: 240 px;
- white surface;
- right border `color-border`;
- logo region: 72 px high;
- navigation starts 16 px below logo region;
- navigation item height: 44 px;
- navigation item radius: 10 px;
- profile and plan card anchored near bottom;
- sidebar content scrolls independently only when viewport height is insufficient.

Selected item:

- background `emerald-50`;
- icon and text `emerald-700`;
- weight 600;
- optional 3 px left indicator on high-density variants.

## 10.3 Application top bar

Desktop top bar:

- height: 64 px;
- optional global search;
- notification or status icon;
- profile avatar;
- page-specific actions may appear on the right.

Mobile top bar:

- minimum height: 56 px;
- page title left;
- one or two icon actions right;
- no duplicate logo when bottom navigation is visible unless on application entry.

## 10.4 Mobile bottom navigation

- fixed to bottom;
- height: 64 px plus safe-area inset;
- white surface;
- top border;
- five equal-width items;
- icon 20 px;
- label 11–12 px;
- selected item uses emerald icon and label;
- no floating center action that obscures content;
- page content includes bottom padding of at least 88 px.

## 10.5 Page header

Standard application page header contains:

- eyebrow or breadcrumb when necessary;
- page title;
- one-sentence supporting text when needed;
- primary page action;
- optional secondary actions;
- optional status badge.

Desktop title and actions share one row when space permits.

Mobile stacks title, supporting text, and full-width primary action when necessary.

## 10.6 Profile menu

Profile menu includes:

- avatar;
- display name;
- plan badge;
- Profile;
- Subscription;
- Settings;
- Help;
- Sign In or Sign Out.

The menu always shows Sign Out for authenticated account profiles.

## 10.7 Global banners

Global banners appear below the top bar and above page content.

Priority order:

1. account or security action required;
2. payment or entitlement action required;
3. synchronization failure;
4. offline mode;
5. browser notification status;
6. informational announcement.

Only one persistent high-priority banner is shown at a time. Lower-priority messages may appear as toasts or within their relevant page.

---

# 11. Core Component System

## 11.1 Buttons

### Primary button

- background: `color-primary`;
- text: white after contrast verification;
- minimum height: 44 px desktop, 48 px touch;
- horizontal padding: 16–20 px;
- radius: `radius-md`;
- hover: `color-primary-hover`;
- pressed: `color-primary-pressed`;
- disabled: muted surface and disabled text;
- loading: spinner plus unchanged button width.

Use for one primary action per panel or page section.

### Secondary button

- background: `emerald-50`;
- text: `emerald-700`;
- border: optional `emerald-200`;
- same dimensions as primary.

### Outline button

- white background;
- standard border;
- primary or neutral text;
- hover background `neutral-100`.

### Ghost button

- transparent background;
- neutral or primary text;
- hover background `neutral-100` or `emerald-50`.

### Destructive button

- coral background for final irreversible confirmation;
- outline or ghost destructive style for entry actions;
- must name the destructive result, such as `Delete account`.

### Icon button

- minimum 40 × 40 px;
- tooltip for unlabeled desktop use;
- accessible name always required;
- mobile critical actions should include visible text where practical.

## 11.2 Links

- standard link: `emerald-700` with underline on hover and focus;
- inline link retains underline where ambiguity is possible;
- external link may include an external-link icon;
- disabled links are not focusable.

## 11.3 Navigation item

Variants:

- default;
- hover;
- selected;
- action required;
- disabled;
- compact mobile.

Count badges must not replace text labels.

## 11.4 Cards

Standard card:

- white background;
- 1 px border;
- radius 14 px;
- padding 20–24 px desktop;
- padding 16 px mobile;
- optional `shadow-1`;
- clear header, body, and footer zones.

Variants:

- standard;
- selectable;
- selected;
- locked;
- warning;
- recovery;
- premium;
- disabled;
- skeleton.

## 11.5 Habit card

Habit card content order:

1. habit icon or category marker;
2. habit name;
3. schedule and target summary;
4. status or lifecycle badge when needed;
5. completion or consistency indicator;
6. daily action group or card action;
7. sync or warning metadata only when relevant.

Today variant:

- Full and Minimum are visible actions;
- Skipped is available as a lower-emphasis action;
- recorded state replaces action group with result and Edit;
- pending sync displays a compact queued indicator;
- card remains readable at 320 px width.

Habits-list variant:

- shows lifecycle status;
- shows next schedule;
- shows consistency summary;
- opens Habit Detail from the card body;
- menu contains secondary management actions.

## 11.6 Check-in action group

Desktop:

```text
[ Full ] [ Minimum ] [ More ▾ ]
```

Mobile:

```text
[ Full ] [ Minimum ]
[ Skip or more options ]
```

Rules:

- Full is primary when no user preference indicates otherwise;
- Minimum is a positive success option, not a warning;
- Skipped uses neutral styling;
- all options include text labels;
- keyboard arrow-key behavior is required when implemented as a radio or segmented group;
- confirmation is optimistic with a visible pending state when offline.

## 11.7 Status badge

Badge structure:

- optional icon;
- short label;
- soft surface;
- semantic border when needed;
- height 24–28 px.

Supported badges include:

```text
Free
Lite
Premium
Trial
Active
Stable
At Risk
Recovery
Rebuilding
Needs Review
Paused
Stopped
Completed
Archived
Pending sync
Offline
Action required
```

## 11.8 Chips and filters

Filter chips include:

- label;
- optional count;
- selected state;
- keyboard focus;
- removable state only when explicitly required.

Chip height: 32–36 px.

Selected filters use emerald surface and text, not fully filled dark green unless contrast remains clear.

## 11.9 Progress indicators

### Circular progress

- used for daily completion and compact consistency metrics;
- minimum 72 px diameter;
- direct percentage or count in center;
- track uses `neutral-150`;
- progress uses emerald unless another semantic state applies.

### Linear progress

- height: 6–8 px;
- rounded ends;
- visible label and value;
- do not communicate completion through color alone.

### Step progress

Used in habit creation and focused flows.

- desktop may show labeled steps;
- mobile shows current step and total;
- completed steps use emerald;
- current step includes visible text.

## 11.10 Recommendation card

Contains:

- recommendation title;
- reason based on observed behavior;
- proposed change;
- expected duration or review date;
- Apply;
- Not now;
- optional Modify.

Recovery recommendations use purple surface accents. Ordinary optimization recommendations use emerald or neutral surfaces.

## 11.11 Recovery tool card

Contains:

- purple icon tile;
- tool name;
- one-line purpose;
- duration or effort;
- Start action;
- optional completion status.

Cards may display in a two-column grid on tablet and larger screens and a single column on mobile.

## 11.12 Plan card

Contains:

- plan name;
- monthly or annual price;
- trial information;
- feature summary;
- current-plan state;
- recommended badge where justified;
- CTA;
- billing disclosure reference.

Premium highlight uses gold accents with emerald CTA. Do not use flashing, countdown pressure, or deceptive visual hierarchy.

## 11.13 Tabs

- visible text labels;
- active indicator: 2 px emerald underline or selected pill;
- tab height at least 44 px;
- horizontally scrollable on mobile when necessary;
- active tab scrolls into view;
- tab panels preserve focus and browser history when routed.

## 11.14 Accordion

Used for:

- public FAQ;
- advanced habit settings;
- data export details;
- billing explanation.

The trigger includes text and chevron. Entire trigger row is clickable. Expanded state is announced to assistive technology.

## 11.15 Tooltip

Tooltips are supplementary only.

- appear on hover and keyboard focus;
- do not contain essential actions;
- dismiss on Escape;
- do not cover the triggering element;
- are not used as the only mobile explanation.

## 11.16 Dropdown menu

- width based on content, minimum 180 px;
- 8 px internal padding;
- item height at least 40 px;
- destructive items separated visually;
- keyboard arrow navigation;
- Escape closes and returns focus.

## 11.17 Dialog

Use for:

- destructive confirmation;
- brief authentication prompt;
- version-change warning;
- checkout confirmation summary;
- short focused decisions.

Desktop:

- centered;
- 480–640 px typical width;
- maximum height 85vh.

Mobile:

- full-width sheet or near-full-screen dialog;
- actions remain visible without covering fields.

## 11.18 Drawer and navigation sheet

Use for:

- mobile More navigation;
- filters;
- contextual habit details;
- non-destructive multi-control panels.

Drawer must have:

- title;
- close button;
- scrollable body;
- optional sticky footer;
- focus trap;
- Escape dismissal on desktop.

## 11.19 Toast

Toast supports:

- success;
- information;
- warning;
- error.

Rules:

- appears for 4–8 seconds depending on content;
- critical errors remain visible elsewhere;
- includes Retry or Undo where relevant;
- does not appear as the sole confirmation for destructive actions;
- screen-reader announcement uses appropriate live-region priority.

## 11.20 Table and responsive data list

Desktop tables may be used for:

- reminder schedules;
- data export history;
- billing history;
- account sessions;
- administrative data lists if added later.

Below tablet width, tables transform into stacked cards or horizontal scroll with fixed first column only when card conversion would remove meaning.

## 11.21 Avatar

- sizes: 28, 36, 44, and 64 px;
- image when available;
- initials fallback;
- brown default accent from approved visual;
- no status encoded solely through avatar border.

---

# 12. Form and Input Patterns

## 12.1 Text input

- height: 44 px desktop, 48 px touch;
- radius: 10 px;
- white surface;
- standard border;
- label above field;
- optional helper text below;
- error text below with icon;
- placeholder must not replace the label.

States:

```text
Default
Hover
Focus
Filled
Disabled
Read-only
Error
Success when confirmation is useful
Loading or validating
```

## 12.2 Text area

- minimum 112 px height;
- resize vertically on desktop;
- character count only when a limit exists;
- optional-note fields must explicitly state `Optional`.

## 12.3 Select and combobox

- native or accessible custom behavior;
- searchable only when option count justifies it;
- selected value remains visible;
- clear action only when no value is valid;
- mobile may use a full-width selection sheet.

## 12.4 Checkbox

Use for independent selections such as friction reasons or recommendation batches.

- box at least 20 px;
- target at least 44 px;
- label clickable;
- indeterminate state supported where needed.

## 12.5 Radio group

Use for one choice from a small set, such as schedule type or billing interval.

Cards may behave as radio options when the selected state is explicit.

## 12.6 Toggle

Use for immediate reversible settings such as enabling a reminder.

Do not use a toggle for:

- navigation;
- destructive confirmation;
- actions requiring a save workflow;
- permissions controlled by the browser.

## 12.7 Date and time controls

- display in the user's locale;
- store and interpret using the user's selected timezone;
- show timezone when ambiguity matters;
- mobile may use native date/time pickers;
- keyboard entry remains possible on desktop.

## 12.8 Validation

Validation occurs:

- after blur for ordinary fields;
- after submit for untouched required fields;
- immediately only when the user can act on the feedback without disruption.

Error summaries appear at the top for long forms and link to invalid fields.

## 12.9 Form action layout

Desktop:

- primary action right aligned in focused forms or left aligned in page forms according to context;
- secondary action adjacent;
- destructive actions separated.

Mobile:

- primary action full width where practical;
- sticky footer may be used for multi-step creation;
- content remains visible above the virtual keyboard.

## 12.10 Draft state

Draft-preserving forms show one of:

```text
Saved
Saving
Saved locally
Pending sync
Could not save — Retry
```

Do not show a misleading synchronized state when data exists only in browser storage.

---

# 13. Feedback, State, and System-Status Patterns

## 13.1 Loading

Use skeletons for page and card loading when structure is known.

Use a spinner for:

- compact button operations;
- indeterminate server verification;
- short inline refresh.

A loading state longer than approximately two seconds includes explanatory text.

## 13.2 Empty state

An empty state contains:

1. simple icon or illustration;
2. clear title;
3. one-sentence explanation;
4. one primary action;
5. optional secondary help link.

Empty states must not imply user failure.

## 13.3 Error state

Error state contains:

- what failed;
- whether data is safe;
- what the user can do;
- Retry where appropriate;
- support reference only when useful.

Technical error IDs may appear in expandable details, not as the main message.

## 13.4 Offline state

Global offline banner:

- neutral or blue informational surface;
- `You are offline` label;
- explanation of what remains available;
- pending action count when relevant;
- retry status when connection returns.

Offline-capable actions:

- check-in;
- edit same-day check-in where locally available;
- draft habit creation;
- view cached Today and Habits data.

Cloud-only actions show an explicit connectivity requirement.

## 13.5 Pending synchronization

Pending state uses:

- blue icon;
- text label;
- no blocking modal;
- retry path when failure persists.

A completed check-in remains visually recorded while pending synchronization.

## 13.6 Session expired

Display a focused session-expired page or dialog with:

- explanation;
- Sign In action;
- legacy local-data recovery only after authentication;
- preservation statement for unsynchronized local data;
- no automatic destructive redirect.

## 13.7 Locked state

Locked Premium components show:

- visible preview;
- lock icon;
- concise benefit explanation;
- Premium CTA;
- no fake interactive control that fails after use.

## 13.8 Success state

Use restrained success feedback:

- check icon;
- emerald label;
- updated card state;
- optional toast;
- no mandatory celebration animation.

---

# 14. Public Website Screens

## 14.1 PUB-001 Landing page

Content order:

1. public header;
2. hero with product promise;
3. primary CTA `Start Free`;
4. secondary CTA `See how it works`;
5. product dashboard preview;
6. recovery-first value explanation;
7. three-step workflow;
8. feature highlights;
9. plan summary;
10. privacy and control section;
11. FAQ;
12. final CTA;
13. footer.

Hero visual uses the approved emerald, white, and soft gray palette.

## 14.2 PUB-002 Features

Groups features by user outcome:

- start realistically;
- complete at Full or Minimum;
- recover after difficulty;
- review patterns;
- adapt habits;
- protect and control data.

## 14.3 PUB-003 How It Works

Shows the product loop:

```text
Design → Do → Check in → Identify friction → Adapt → Recover
```

Each step uses a small diagram and concise explanation.

## 14.4 PUB-004 Pricing

Contains:

- Free, Lite, and Premium comparison;
- monthly and annual billing selector;
- 14-day trial disclosure;
- exact post-trial price placeholder populated from authoritative configuration;
- cancellation explanation;
- FAQ;
- Sign In or Start Free path.

Do not hard-code unsupported payment claims into visual assets.

## 14.5 PUB-005 Help and status

Help page includes searchable topics and contact path.

Status page link is visible in the footer and error surfaces when relevant.

---

# 15. Authentication and Application-Entry Screens

## 15.1 AUTH-001 Application entry

Centered responsive state with:

- logo;
- short initialization message;
- compact progress indicator;
- no fake percentage.

Possible transitions:

- restore signed-in account;
- restore signed-in account;
- recover legacy local data;
- recover from offline cache;
- show session-expired state.

## 15.2 AUTH-002 Sign in

Card width: 400–440 px.

Content:

- title;
- supporting benefit text;
- Continue with Google;
- divider;
- email field;
- Send magic link or OTP;
- no unauthenticated application continuation;
- privacy and terms links.

## 15.3 AUTH-003 Email sent

Contains:

- masked email address;
- instructions;
- resend timer;
- change-email link;
- OTP field when OTP is enabled;
- support for opening the link in another tab.

## 15.4 AUTH-004 Callback processing

Centered processing panel with idempotent refresh behavior.

States:

- verifying;
- success;
- expired link;
- already used;
- account conflict;
- offline;
- unexpected failure.

## 15.5 AUTH-005 Legacy local data recovery

Displays:

- local habit count;
- account habit count;
- merge implications;
- conflicts requiring decisions;
- transfer progress;
- recoverable failure state.

No legacy local data is deleted before verified transfer or export completion.

---

# 16. Today and Daily Check-In Screens

## 16.1 APP-001 Today dashboard

Desktop layout:

```text
Page header
Daily progress card + optional quick-actions card
Today's habits list
Recovery or review attention area when applicable
Daily motivation or supportive note
```

Wide desktop may use:

```text
Main column: habits and check-ins
Right rail: daily progress, quick actions, recovery prompt
```

Mobile order:

1. greeting and date;
2. daily progress;
3. action-required banner;
4. today's habits;
5. supportive note;
6. secondary actions.

## 16.2 Daily progress card

Contains:

- circular progress;
- completed count;
- Minimum count where relevant;
- remaining count;
- calm supporting text;
- no punitive missed counter as the dominant metric.

## 16.3 Today habit card states

Required states:

```text
Pending
Full recorded
Minimum recorded
Skipped recorded
Unrecorded
Pending sync
Sync failed
Paused
Recovery plan active
Locked by unresolved version conflict
```

## 16.4 CHK-001 Full check-in

Action result:

- card updates immediately;
- Full label appears;
- Edit available for same-day changes;
- pending synchronization is visible when offline;
- daily progress updates optimistically.

## 16.5 CHK-002 Minimum check-in

Minimum uses amber accent and positive language.

Required message pattern:

```text
Minimum completed
You kept the habit alive today.
```

Do not display Minimum as partial failure.

## 16.6 CHK-003 Skipped check-in

After selection, open a compact drawer or dialog with:

- neutral acknowledgment;
- optional friction reasons;
- optional note;
- Save Skipped;
- Back.

Friction reasons use selectable chips or checkboxes.

## 16.7 CHK-004 Same-day edit

Displays current result and alternatives. The user must understand that editing changes today’s record but does not rewrite historical versions.

## 16.8 CHK-005 Unrecorded resolution

Action-required card shows:

- date;
- habit;
- original schedule;
- Full;
- Minimum;
- Skipped;
- optional dismissal only when product rules permit.

## 16.9 Today empty states

### No habits

Primary action: `Create your first habit`.

### No eligible sessions today

Show upcoming habit information and a calm message.

### All sessions recorded

Show completion summary and optional Weekly Review or Insights link.

---

# 17. Habits and Habit-Detail Screens

## 17.1 APP-002 Habits list

Page header contains:

- title;
- active limit summary;
- Add Habit;
- filter controls.

Filters:

```text
All
Active
At Risk
Recovery
Paused
Completed
Archived
Trash
```

Desktop may use a two-column card grid or single-column detailed list. Mobile uses single-column cards.

## 17.2 HAB-001 Add habit entry

Entry provides:

- Start from template;
- Create custom habit;
- active-limit state;
- saved draft indicator.

## 17.3 Habit creation step structure

Recommended steps:

```text
1. Goal
2. Template or custom definition
3. Full and Minimum targets
4. Schedule and cue
5. Reminder
6. Review
```

Desktop uses a centered 720 px form with visible step progress.

Mobile uses full-width steps and a sticky footer.

## 17.4 Habit definition form

Fields:

- habit name;
- optional description;
- category or icon;
- Full target;
- Minimum target;
- unit;
- schedule;
- preferred time or cue;
- timezone;
- optional reminder.

Full and Minimum examples appear directly below target fields.

## 17.5 Habit summary

Summary shows:

- name;
- Full target;
- Minimum target;
- schedule;
- reminder;
- start date;
- plan-limit impact;
- Create Habit action.

## 17.6 Active limit

When the limit is reached, show:

- current plan and limit;
- active habit list;
- Pause an existing habit;
- Archive or stop where valid;
- Upgrade option;
- cancel path.

Do not silently create an inactive habit unless the user explicitly chooses that behavior.

## 17.7 HAB-002 Habit Detail

Desktop structure:

```text
Header: habit name, status, actions
Tabs: Overview | History | Insights | Versions
Overview main column
Summary or consistency right rail
```

Mobile structure:

```text
Back + action menu
Habit name and status
Horizontally scrollable tabs
Single-column tab content
```

## 17.8 Habit Overview

Contains:

- definition;
- Full target;
- Minimum target;
- schedule;
- cue;
- reminder;
- current lifecycle status;
- current version;
- this-week completion;
- primary management action.

## 17.9 Habit History

History uses a chronological list or calendar-like view with direct labels for Full, Minimum, Skipped, and Unrecorded.

## 17.10 Habit Versions

Each version card contains:

- version number or effective date;
- definition summary;
- Full and Minimum targets;
- active period;
- reason for change when available;
- Restore or Compare action when valid.

## 17.11 Habit management actions

Actions include:

```text
Edit
Redesign
Pause
Resume
Stop
Complete
Archive
Move to Trash
Restore
Delete permanently when eligible
```

Destructive and irreversible actions require explicit confirmation.

---

# 18. Recovery and Weekly Review Screens

## 18.1 Recovery banner

Appears on Today or Habit Detail when Recovery is triggered.

Contains:

- purple icon;
- calm title;
- brief reason;
- one recommended next step;
- Review Recovery Plan;
- Not now where allowed.

## 18.2 REC-001 Recovery overview

Desktop:

```text
Recovery status summary
Recommended action
Recovery tools grid
Short-term goals
Affected habits
```

Mobile uses the same order in one column.

## 18.3 Recovery recommendation

The recommendation panel explains:

- detected difficulty;
- proposed temporary change;
- duration;
- what remains unchanged;
- how success will be evaluated;
- Apply;
- Modify;
- Not now.

## 18.4 Recovery progress

Uses purple accents with emerald completion states.

Displays:

- recovery day count;
- actions completed;
- upcoming review date;
- affected habit status;
- exit or adjust path.

## 18.5 Recovery tools

Examples from the approved visual:

```text
Urge surfing
Grounding
Breathing
Affirmations
```

Each tool page or dialog includes:

- purpose;
- estimated time;
- step sequence;
- completion action;
- exit action.

## 18.6 Recovery result

### Success

- acknowledge restored consistency;
- summarize what helped;
- offer Continue or Adapt Habit;
- avoid exaggerated celebration.

### Needs Review

- explain that the current design may not fit;
- present redesign options;
- preserve history;
- no automatic deletion or reset.

## 18.7 APP-003 Weekly Review

Desktop layout may use:

```text
Weekly summary cards
Highlights and patterns
Recommendation list
Reflection note
Apply selected changes
```

Mobile order:

1. week and completion summary;
2. highlights;
3. areas to improve;
4. recommendations;
5. reflection;
6. Complete Review.

## 18.8 Recommendation batch selection

Each recommendation includes a checkbox, reason, proposed change, and Modify action.

The final action states the number of selected changes.

---

# 19. Insights Screens

## 19.1 APP-004 Insights overview

Desktop content:

- period selector;
- weekly progress chart;
- overall consistency;
- habit completion comparison;
- Full, Minimum, Skipped, and Unrecorded distribution;
- trend cards;
- habit filter.

Mobile content remains single-column with horizontally scrollable compact filters.

## 19.2 Chart cards

Every chart card includes:

- title;
- period;
- direct current value;
- comparison text when valid;
- accessible summary;
- data-state explanation.

## 19.3 Habit comparison

Use horizontal bars for completion rates. Habit names remain visible and are not truncated without a tooltip or accessible full label.

## 19.4 Check-in summary

Use labeled icons or bars for:

```text
Full
Minimum
Skipped
Unrecorded
```

Do not use unlabeled emoji-only summaries.

## 19.5 Insufficient data

State explains how much data is needed and links back to Today or Habits. Do not render misleading zero-value charts.

---

# 20. Reminders Screens

## 20.1 APP-005 Reminders list

Desktop may use cards or a simple table.

Each reminder row contains:

- habit;
- scheduled time;
- repeat pattern;
- delivery channel;
- enabled toggle;
- permission or delivery state;
- edit action.

## 20.2 Reminder editor

Fields:

- habit;
- enabled state;
- time;
- repeat schedule;
- primary channel;
- follow-up reminder;
- quiet hours interaction;
- timezone;
- Save.

## 20.3 Browser notification permission

Contextual panel contains:

- benefit explanation;
- what notifications will contain;
- browser-level permission explanation;
- Enable browser notifications;
- Not now;
- email alternative where available.

## 20.4 Permission denied or unsupported

Use informational or warning styling, not error styling.

Provide:

- current permission state;
- browser settings instructions;
- email reminder alternative;
- in-application reminder behavior.

---

# 21. Settings, Profile, and Data-Management Screens

## 21.1 APP-006 Settings

Desktop layout:

```text
Settings navigation rail
Settings content panel
```

Settings sections:

```text
General
Notifications
Privacy
Security
Appearance
Data and export
Account
```

Mobile uses a settings list followed by dedicated subpages.

## 21.2 General settings

Contains:

- language;
- timezone;
- week start;
- date format where applicable;
- reduced animation preference when exposed;
- Save behavior.

## 21.3 Profile

Contains:

- avatar;
- display name;
- email and account state;
- plan;
- legacy local data recovery or export prompt where applicable;
- subscription management;
- sign-out action for accounts.

## 21.4 Privacy settings

Contains:

- analytics consent where required;
- notification preferences;
- data-use explanation;
- privacy policy;
- account data summary.

## 21.5 Security settings

Contains:

- authentication method;
- active sessions where supported;
- sign out all sessions;
- recent security events where supported;
- email verification status.

## 21.6 Data export

Shows:

- export scope;
- format;
- request action;
- processing state;
- ready state;
- expiry of download link;
- failure and retry.

## 21.7 Account deletion

Dedicated destructive section with:

- consequences;
- export recommendation;
- active subscription implications;
- typed or explicit confirmation;
- processing state;
- final confirmation.

---

# 22. Subscription Screens

## 22.1 SUB-001 Plan selection

Desktop displays two or three plan cards in one row where space permits.

Mobile displays stacked cards.

Plan selection includes:

- monthly and annual selector;
- trial length;
- exact post-trial price from configuration;
- first billing date;
- renewal terms;
- cancellation path;
- refund-policy link;
- selected plan summary.

## 22.2 SUB-002 Checkout confirmation

Before leaving for or opening the approved checkout provider, display:

- selected plan;
- billing interval;
- trial terms;
- post-trial price;
- first billing date;
- auto-renewal disclosure;
- cancellation path;
- Confirm and continue;
- Back.

## 22.3 SUB-003 Processing Payment

Centered status panel contains:

- processing indicator;
- `Processing payment` title;
- explanation that entitlement is verified by the server;
- refresh-status action after a reasonable delay;
- safe navigation guidance;
- support path after terminal failure.

The browser return alone never displays Premium as confirmed.

## 22.4 SUB-004 Subscription management

Displays:

- current plan;
- status;
- trial end, next billing, or expiry date;
- billing interval;
- payment-action-required state;
- change plan;
- cancel renewal;
- refresh status;
- billing history where available.

## 22.5 SUB-005 Premium expiry

Shows:

- what access changed;
- active-habit limit impact;
- required resolution when over limit;
- preserved data statement;
- resubscribe option;
- no data deletion threat.

---

# 23. Responsive Behavior

## 23.1 Desktop and wide screens

- Sidebar remains visible.
- Main content is centered within maximum width.
- Dashboard may use a right rail.
- Dialogs remain centered.
- Filters may remain inline.
- Tables may use full columns.
- Hover states supplement, but do not replace, visible information.

## 23.2 Laptop

- Sidebar remains visible at 220–240 px.
- Three-column layouts reduce to two columns.
- Right rail may move below main content.
- Page headers may wrap actions to a second row.

## 23.3 Tablet

- Sidebar is removed.
- Bottom navigation appears.
- Page header becomes compact.
- Two-column cards remain where each card is at least 280 px wide.
- Drawers may open from the right or bottom.
- Wide tables convert to cards or horizontal scroll.

## 23.4 Mobile

- All core content uses one column.
- Bottom navigation remains fixed.
- Page actions become full width when needed.
- Dialogs become sheets or full-screen flows.
- Cards use 16 px padding.
- Form labels remain above fields.
- Primary daily actions remain visible without horizontal scrolling.
- Charts fit the viewport and expose summaries.

## 23.5 Small mobile

At 320–359 px:

- no clipped labels;
- check-in actions may stack;
- badges wrap or move below titles;
- page gutters may reduce to 12 px;
- minimum target size remains 44 px;
- text does not scale below the defined minimum.

---

# 24. Accessibility Requirements

## 24.1 Keyboard

All application functionality must be usable with keyboard alone.

Required behavior:

- logical tab order;
- visible focus indicator;
- Escape closes dismissible overlays;
- Enter and Space activate expected controls;
- arrow keys operate tabs, radio groups, menus, and segmented controls where applicable;
- focus returns to the triggering element after overlay closure.

## 24.2 Screen readers

- landmarks for header, navigation, main content, complementary content, and footer;
- one primary page heading;
- form controls with programmatic labels;
- errors associated with fields;
- status changes announced through live regions;
- chart summaries available as text;
- icons hidden when decorative and labeled when meaningful.

## 24.3 Focus management

- route changes move focus to the page heading or main region;
- dialogs trap focus;
- async errors move focus only when immediate action is required;
- validation summaries receive focus after failed submission;
- toasts do not steal focus.

## 24.4 Zoom and reflow

At 200% zoom:

- no horizontal scrolling for ordinary page content at a 1280 px viewport except data visualizations or intentionally scrollable tables;
- controls remain operable;
- fixed navigation does not obscure content;
- text does not overlap.

## 24.5 Motion and flashing

- honor reduced motion;
- no flashing content;
- no rapid color changes;
- no essential meaning conveyed only through animation.

## 24.6 Language and readability

- plain, direct labels;
- sentence case;
- no unexplained technical terminology;
- error copy states recovery action;
- time and date formats follow locale and timezone.

---

# 25. Content and Tone Rules

## 25.1 Product voice

The product voice is:

- calm;
- specific;
- non-judgmental;
- concise;
- honest about system status;
- supportive without exaggeration.

## 25.2 Preferred terms

Use:

```text
Full
Minimum
Skipped
Unrecorded
Recovery
Needs Review
Continue
Adapt
Try again
Pending sync
Saved locally
```

Avoid:

```text
Failed habit
You broke your streak
Bad day
Perfect user
You should have
No excuses
```

## 25.3 Button labels

Buttons describe the result:

```text
Create habit
Record Full
Record Minimum
Save Skipped
Apply recommendation
Enable notifications
Start free
Confirm checkout
Cancel renewal
Export data
Delete account
```

Avoid vague labels such as `Submit`, `OK`, or `Continue` when a more specific result is available.

## 25.4 Error copy pattern

```text
What happened
What is safe or unchanged
What the user can do next
```

Example:

```text
We could not sync this check-in.
It is still saved in this browser.
Retry when you are online.
```

---

# 26. Required State Matrix

Every applicable screen or component must define these states before implementation is accepted:

| State | Required treatment |
|---|---|
| Default | Normal content and actions |
| Loading | Skeleton or explanatory progress |
| Empty | Contextual explanation and next action |
| Partial data | Visible limitations and usable available content |
| Offline | Clear available and unavailable behavior |
| Pending sync | Non-blocking queued status |
| Sync failed | Data-safety statement and Retry |
| Error | Cause category and recovery action |
| Disabled | Visible reason where not obvious |
| Locked | Premium or permission explanation |
| Action required | Clear priority and next step |
| Success | Updated persistent state, not toast only |
| Session expired | Sign-in recovery and local-data statement |
| Permission denied | Browser instructions and alternative |
| Payment pending | Server-verification state |
| Payment failed | Recovery path without accidental duplicate charge |
| Destructive confirmation | Consequences and explicit action |

---

# 27. Design Handoff and Implementation Contract

## 27.1 Figma requirements

Figma must contain:

- variables or styles matching all color tokens;
- typography styles;
- spacing conventions;
- component variants;
- responsive desktop, tablet, and mobile frames;
- loading, empty, offline, error, locked, and action-required states;
- interaction annotations;
- accessible names for ambiguous icon controls;
- content examples that fit realistic lengths.

## 27.2 Component naming

Recommended component groups:

```text
Foundations/Color
Foundations/Typography
Foundations/Spacing
Actions/Button
Actions/IconButton
Navigation/SidebarItem
Navigation/BottomNavItem
Navigation/Tabs
DataDisplay/Card
DataDisplay/StatusBadge
DataDisplay/Progress
Habit/HabitCard
Habit/CheckInActions
Habit/ConsistencySummary
Recovery/RecommendationCard
Recovery/ToolCard
Feedback/Banner
Feedback/Toast
Feedback/EmptyState
Feedback/ErrorState
Forms/TextInput
Forms/Select
Forms/Checkbox
Forms/RadioCard
Forms/Toggle
Overlay/Dialog
Overlay/Drawer
Subscription/PlanCard
```

## 27.3 Token implementation

Implementation must expose semantic variables equivalent to:

```text
--color-page
--color-surface
--color-surface-subtle
--color-text-primary
--color-text-secondary
--color-border
--color-primary
--color-primary-hover
--color-primary-pressed
--color-primary-surface
--color-success
--color-minimum
--color-skipped
--color-recovery
--color-warning
--color-danger
--color-info
--color-premium
--radius-sm
--radius-md
--radius-lg
--radius-xl
--shadow-1
--shadow-2
--shadow-3
```

Component code must not invent new brand colors without a specification update.

## 27.4 Visual regression coverage

Visual regression coverage must include at minimum:

- public header desktop and mobile;
- application sidebar;
- mobile bottom navigation;
- Today default, empty, completed, offline, and sync-failed states;
- habit card variants;
- Full, Minimum, Skipped, and Unrecorded states;
- habit creation form desktop and mobile;
- Recovery banner and recommendation;
- Weekly Review;
- Insights chart cards;
- reminder permission states;
- plan cards;
- processing payment;
- settings desktop and mobile;
- dialogs and drawers;
- 200% zoom smoke coverage.

---

# 28. UI Acceptance Checklist

## 28.1 Foundations

- [ ] The implemented palette matches the approved emerald, white, soft-gray, amber, coral, purple, blue, gold, and brown tokens.
- [ ] Primary controls use the emerald token family.
- [ ] Minimum uses amber and remains positive.
- [ ] Skipped uses neutral styling rather than default red.
- [ ] Recovery uses purple accents.
- [ ] Premium uses gold or amber accents with readable text.
- [ ] Text, focus, and component contrast meet accessibility requirements.
- [ ] Light theme is complete across all required states.

## 28.2 Responsive shell

- [ ] Desktop and laptop use the left sidebar.
- [ ] Tablet and mobile use bottom navigation.
- [ ] The `More` navigation sheet exposes secondary destinations.
- [ ] Navigation labels remain visible.
- [ ] Fixed navigation never obscures page content.
- [ ] All reference frames are represented in design files.

## 28.3 Components

- [ ] Buttons include default, hover, focus, pressed, loading, and disabled states.
- [ ] Inputs include labels, helper text, error text, focus, disabled, and read-only states.
- [ ] Habit cards include all required daily and lifecycle variants.
- [ ] Check-in actions remain usable without hover.
- [ ] Dialogs and drawers manage focus correctly.
- [ ] Toasts are not the sole source of critical status.
- [ ] Charts provide accessible summaries and direct values.

## 28.4 Screens

- [ ] Public landing, features, how-it-works, pricing, help, and status paths are designed.
- [ ] Account entry and authentication states are designed.
- [ ] Today includes empty, complete, offline, pending-sync, and sync-failed states.
- [ ] Habit creation includes templates, custom definition, targets, schedule, reminder, summary, and active-limit resolution.
- [ ] Habit Detail includes Overview, History, Insights, and Versions.
- [ ] Recovery and Needs Review states are designed.
- [ ] Weekly Review includes batch recommendation approval.
- [ ] Insights includes insufficient-data states.
- [ ] Reminders include permission-denied and unsupported-browser states.
- [ ] Settings include privacy, security, export, and deletion.
- [ ] Subscription includes plan selection, confirmation, processing, management, failure, expiry, and over-limit resolution.

## 28.5 Accessibility

- [ ] Every control has a visible keyboard focus state.
- [ ] All icon-only controls have accessible names.
- [ ] Page hierarchy uses one primary heading.
- [ ] Form errors are programmatically associated with fields.
- [ ] Color is never the sole state indicator.
- [ ] Motion respects reduced-motion preferences.
- [ ] Content reflows at 200% zoom.
- [ ] Touch targets meet minimum dimensions.

## 28.6 Product tone

- [ ] No screen uses shame or punishment as motivation.
- [ ] Minimum is communicated as success.
- [ ] Skipped and Unrecorded are presented neutrally.
- [ ] Recovery copy provides a practical next step.
- [ ] Offline, synchronization, and payment states are honest about what is confirmed.
- [ ] Destructive actions state the consequence explicitly.

---

# End of Specification
