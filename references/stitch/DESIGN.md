# Recovery-First Habit Tracker

## Google Stitch Design System

| Field                          | Value                                               |
| ------------------------------ | --------------------------------------------------- |
| Document status                | Authoritative visual design input for Google Stitch |
| Version                        | 1.0                                                 |
| Prepared                       | 30 July 2026                                        |
| Product stage                  | Greenfield / pre-development                        |
| Platform                       | Responsive website and installable PWA              |
| Theme                          | Light theme for MVP                                 |
| Authoritative layout reference | Stitch layout ID `12495258549845976462`             |
| Product brief                  | `STITCH-BRIEF.md`                                   |
| Supporting specification       | `UI-SPEC.md`                                        |

---

# 1. Authority and Usage

This document is the authoritative visual design system for the Recovery-First Habit Tracker in Google Stitch.

Use this document to control:

- visual personality;
- color tokens;
- typography;
- spacing;
- grids;
- navigation;
- icons;
- components;
- operational states;
- responsive behavior;
- accessibility;
- consistency across generated screens.

When references conflict, follow this order:

1. `DESIGN.md` for visual rules and shared component styling;
2. Stitch layout ID `12495258549845976462` for application-shell composition;
3. `STITCH-BRIEF.md` for product context and screen priorities;
4. `UI-SPEC.md` for detailed screen and component requirements;
5. `UX-FLOWS.md` for interaction and navigation sequence.

Do not infer backend behavior, billing rules, database architecture, or implementation code from this file.

## 1.1 Preservation rule

When updating an existing screen, preserve its:

- content;
- data;
- labels;
- actions;
- user flow;
- operational state;
- state-specific messages;
- dialogs;
- banners;
- skeletons;
- warnings;
- confirmations.

Only update shared visual structure when required to match this design system and layout ID `12495258549845976462`.

---

# 2. Product Design Personality

The product must feel:

- calm;
- supportive;
- contemporary;
- practical;
- clear;
- trustworthy;
- lightly optimistic;
- non-clinical;
- non-punitive;
- suitable for repeated daily use.

The interface should communicate that difficulty is normal and recoverable.

## 2.1 Visual language

Use:

- white cards on soft gray-green page backgrounds;
- emerald green for primary actions and selected navigation;
- restrained semantic accent colors;
- rounded rectangular components;
- subtle borders;
- minimal shadows;
- compact rounded line icons;
- clear hierarchy;
- generous but controlled spacing;
- simple progress and chart treatments;
- supportive explanatory copy.

Avoid:

- aggressive gamification;
- flame-based streak metaphors;
- broken-chain imagery;
- shame-oriented warnings;
- bright red for ordinary skipped sessions;
- heavy gradients;
- glassmorphism;
- neon colors;
- excessive shadows;
- decorative animation;
- mixed icon libraries;
- mobile-native patterns that conflict with responsive web behavior.

---

# 3. Theme and Surface Model

MVP uses one complete light theme.

Dark mode is outside MVP scope.

## 3.1 Surface hierarchy

| Surface          | Token                    | Use                                    |
| ---------------- | ------------------------ | -------------------------------------- |
| Page background  | `color-page`             | Main application canvas                |
| Primary surface  | `color-surface`          | Cards, dialogs, menus, forms           |
| Subtle surface   | `color-surface-subtle`   | Secondary panels and grouped controls  |
| Selected surface | `color-surface-selected` | Active navigation and selected options |
| Overlay          | White with shadow        | Dialogs, popovers, dropdowns           |
| Disabled surface | Neutral muted surface    | Disabled controls and locked areas     |

Use borders and tonal contrast before adding shadows.

---

# 4. Color System

All generated screens must use semantic tokens. Do not introduce unapproved colors.

## 4.1 Primary emerald palette

| Token         | Hex       | Use                                     |
| ------------- | --------- | --------------------------------------- |
| `emerald-950` | `#0A3D24` | Rare high-contrast brand text           |
| `emerald-900` | `#0D522F` | Deep pressed states                     |
| `emerald-800` | `#106038` | Strong brand emphasis                   |
| `emerald-700` | `#106838` | Selected navigation and focus emphasis  |
| `emerald-600` | `#187040` | Primary hover                           |
| `emerald-500` | `#288848` | Primary actions and progress            |
| `emerald-400` | `#309050` | Secondary positive data series          |
| `emerald-300` | `#629176` | Muted positive icon and selected border |
| `emerald-200` | `#A0C8B0` | Positive borders and disabled primary   |
| `emerald-100` | `#DDEFE4` | Selected navigation background          |
| `emerald-50`  | `#F0F7F3` | Positive and selected surface           |

## 4.2 Neutral palette

| Token         | Hex       | Use                           |
| ------------- | --------- | ----------------------------- |
| `neutral-950` | `#161A17` | Primary text                  |
| `neutral-900` | `#242A26` | Headings and strong icons     |
| `neutral-800` | `#355749` | Brand-adjacent dark neutral   |
| `neutral-700` | `#4E5B54` | Secondary text                |
| `neutral-600` | `#68736D` | Supporting text               |
| `neutral-500` | `#7F8A84` | Metadata and placeholder text |
| `neutral-400` | `#9FA9A4` | Disabled icons and text       |
| `neutral-300` | `#C4CFCD` | Strong borders                |
| `neutral-200` | `#DDE5E1` | Standard borders              |
| `neutral-150` | `#EBEFEF` | Soft borders and tracks       |
| `neutral-100` | `#F0F4F3` | Muted surfaces                |
| `neutral-50`  | `#F8F9F9` | Page background               |
| `white`       | `#FFFFFF` | Primary surface               |

## 4.3 Accent palette

| Family | Main      | Soft surface | Border    | Approved use                 |
| ------ | --------- | ------------ | --------- | ---------------------------- |
| Amber  | `#F59E0B` | `#FFF7E6`    | `#F6D38A` | Minimum, Premium, warning    |
| Coral  | `#EF4444` | `#FFF1F1`    | `#F3B6B6` | Error and destructive only   |
| Purple | `#8B5CF6` | `#F5F0FF`    | `#D9C8FA` | Recovery and adaptation      |
| Blue   | `#3B82F6` | `#EEF5FF`    | `#BED5FA` | Information, synchronization |
| Cyan   | `#38AFC7` | `#ECFAFC`    | `#B9E5EC` | Secondary data series        |
| Gold   | `#EAB308` | `#FFF9DB`    | `#F0D86C` | Premium highlight            |
| Brown  | `#6B4937` | `#F6F1EE`    | `#D8C7BE` | Default avatar accent        |

## 4.4 Semantic tokens

| Semantic token           | Value         |
| ------------------------ | ------------- |
| `color-page`             | `neutral-50`  |
| `color-surface`          | `white`       |
| `color-surface-subtle`   | `neutral-100` |
| `color-surface-selected` | `emerald-50`  |
| `color-text-primary`     | `neutral-950` |
| `color-text-secondary`   | `neutral-700` |
| `color-text-muted`       | `neutral-600` |
| `color-text-disabled`    | `neutral-400` |
| `color-border`           | `neutral-200` |
| `color-border-strong`    | `neutral-300` |
| `color-focus`            | `emerald-700` |
| `color-primary`          | `emerald-500` |
| `color-primary-hover`    | `emerald-600` |
| `color-primary-pressed`  | `emerald-700` |
| `color-primary-disabled` | `emerald-200` |
| `color-primary-surface`  | `emerald-50`  |
| `color-success`          | `emerald-500` |
| `color-success-surface`  | `emerald-50`  |
| `color-minimum`          | `#F59E0B`     |
| `color-minimum-surface`  | `#FFF7E6`     |
| `color-skipped`          | `neutral-600` |
| `color-skipped-surface`  | `neutral-100` |
| `color-unrecorded`       | `neutral-500` |
| `color-recovery`         | `#8B5CF6`     |
| `color-recovery-surface` | `#F5F0FF`     |
| `color-warning`          | `#B86B00`     |
| `color-warning-surface`  | `#FFF7E6`     |
| `color-danger`           | `#EF4444`     |
| `color-danger-surface`   | `#FFF1F1`     |
| `color-info`             | `#3B82F6`     |
| `color-info-surface`     | `#EEF5FF`     |
| `color-premium`          | `#EAB308`     |
| `color-premium-surface`  | `#FFF9DB`     |

## 4.5 Status mapping

| Status       | Color        | Icon                       | Required label                           |
| ------------ | ------------ | -------------------------- | ---------------------------------------- |
| Full         | Emerald      | Check circle               | `Full`                                   |
| Minimum      | Amber        | Leaf or small check circle | `Minimum`                                |
| Skipped      | Neutral gray | Minus circle               | `Skipped`                                |
| Unrecorded   | Neutral gray | Open circle                | `Unrecorded` or `Skipped — not recorded` |
| Pending sync | Blue         | Refresh or cloud upload    | `Pending sync` or `Saving`               |
| Sync failed  | Coral        | Warning triangle           | `Sync failed` plus `Retry`               |
| Recovery     | Purple       | Life buoy or shield-heart  | `Recovery`                               |
| Premium      | Gold         | Crown                      | `Premium`                                |
| Error        | Coral        | Alert circle               | Clear error title and action             |

## 4.6 Color restrictions

- Red or coral is reserved for errors, security warnings, payment failures, and destructive actions.
- Skipped is neutral, not red.
- Minimum is a successful outcome and must not appear as failure.
- Recovery is purple, not red.
- Amber surfaces use dark text, not white text.
- Status meaning must include text or icons, not color alone.
- Charts require direct values, labels, markers, or legends in addition to color.

---

# 5. Typography

## 5.1 Typeface

Use:

```text
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif
```

Do not introduce decorative display fonts.

## 5.2 Type scale

| Token        | Desktop | Mobile | Weight | Line height | Use                       |
| ------------ | ------: | -----: | -----: | ----------: | ------------------------- |
| `display-lg` |   48 px |  38 px |    700 |        1.10 | Landing hero              |
| `display-sm` |   40 px |  32 px |    700 |        1.15 | Public section heading    |
| `heading-1`  |   32 px |  28 px |    700 |        1.20 | Application page title    |
| `heading-2`  |   24 px |  22 px |    700 |        1.25 | Major section heading     |
| `heading-3`  |   20 px |  18 px |    600 |        1.30 | Card-group heading        |
| `heading-4`  |   16 px |  16 px |    600 |        1.35 | Card title                |
| `body-lg`    |   16 px |  16 px |    400 |        1.60 | Introductory copy         |
| `body-md`    |   14 px |  14 px |    400 |        1.55 | Default UI text           |
| `body-sm`    |   13 px |  13 px |    400 |        1.50 | Metadata                  |
| `label-md`   |   14 px |  14 px |    600 |        1.35 | Buttons and form labels   |
| `label-sm`   |   12 px |  12 px |    600 |        1.35 | Badges and compact labels |
| `caption`    |   12 px |  12 px |    400 |        1.45 | Supporting text           |
| `metric-lg`  |   36 px |  32 px |    700 |        1.10 | Key metric                |
| `metric-md`  |   24 px |  22 px |    700 |        1.20 | Card metric               |

## 5.3 Typography rules

- Use sentence case.
- Do not use all caps for ordinary interface text.
- Keep page titles left aligned except focused authentication and checkout screens.
- Do not reduce text below 12 px.
- Keep body-copy line length approximately 45–75 characters.
- Use tabular numerals for metrics where supported.
- Links must be distinguishable by more than color on hover and focus.
- Avoid oversized headings inside application screens.

---

# 6. Spacing and Layout Tokens

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

## 6.1 Page gutters

| Breakpoint | Gutter |
| ---------- | -----: |
| Mobile     |  16 px |
| Tablet     |  24 px |
| Laptop     |  28 px |
| Desktop    |  32 px |
| Wide       |  40 px |

## 6.2 Content widths

| Content type                 | Maximum width |
| ---------------------------- | ------------: |
| Standard application content |       1280 px |
| Reading or form content      |        720 px |
| Authentication form          |    400–440 px |
| Standard dialog              |        640 px |
| Public landing section       |       1200 px |
| Optional contextual rail     |    280–320 px |

## 6.3 Grid

Desktop application grid:

```text
Sidebar: 240 px
Gap after sidebar: 24 px
Main content: fluid
Optional right rail: 280–320 px
Card grid: 12 columns with 24 px gaps
```

Tablet:

```text
8 columns with 20 px gaps
```

Mobile:

```text
4 columns with 16 px gaps
Single-column content by default
```

---

# 7. Shape, Border, Elevation, and Motion

## 7.1 Radius

| Token         |  Value | Use                      |
| ------------- | -----: | ------------------------ |
| `radius-sm`   |   6 px | Compact badges           |
| `radius-md`   |  10 px | Inputs and buttons       |
| `radius-lg`   |  14 px | Standard cards           |
| `radius-xl`   |  18 px | Large panels and dialogs |
| `radius-pill` | 999 px | Chips and status pills   |

## 7.2 Borders

- Standard: 1 px solid `color-border`.
- Strong: 1 px solid `color-border-strong`.
- Focus ring: 2 px `color-focus` with 2 px outer offset.
- Selected card: 1 px `emerald-300` with `emerald-50` surface.
- Destructive selection: coral border with danger surface.

## 7.3 Shadows

```text
shadow-0: none
shadow-1: 0 1px 2px rgba(22, 26, 23, 0.06)
shadow-2: 0 6px 18px rgba(22, 26, 23, 0.08)
shadow-3: 0 16px 40px rgba(22, 26, 23, 0.12)
```

Use:

- cards: `shadow-0` or `shadow-1`;
- dropdowns: `shadow-2`;
- dialogs and sheets: `shadow-3`;
- sticky mobile navigation: top border plus subtle shadow.

## 7.4 Motion

| Token         | Duration | Use                       |
| ------------- | -------: | ------------------------- |
| `motion-fast` |   120 ms | Hover, focus, pressed     |
| `motion-base` |   180 ms | Tabs and expand/collapse  |
| `motion-slow` |   260 ms | Dialog and sheet entrance |

Easing:

```text
standard: cubic-bezier(0.2, 0, 0, 1)
enter: cubic-bezier(0, 0, 0.2, 1)
exit: cubic-bezier(0.4, 0, 1, 1)
```

Rules:

- Respect reduced-motion preferences.
- Do not use bouncing or shaking for validation.
- Do not animate progress from zero on every visit.
- Check-in success may use a subtle state transition without confetti.
- Loading indicators require accompanying text for long operations.

---

# 8. Responsive Breakpoints

| Name         |             Width | Navigation                           | Layout                             |
| ------------ | ----------------: | ------------------------------------ | ---------------------------------- |
| Small mobile |        320–359 px | Bottom navigation                    | Single column with tighter gutters |
| Mobile       |        360–767 px | Bottom navigation                    | Single column                      |
| Tablet       |       768–1023 px | Bottom navigation and compact header | One or two columns                 |
| Laptop       |      1024–1439 px | Persistent left sidebar              | Two-column capable                 |
| Desktop      | 1440 px and above | Persistent left sidebar              | Two- or three-column capable       |

Primary design frames:

```text
Mobile:  390 × 844
Tablet:  834 × 1112
Laptop:  1280 × 800
Desktop: 1440 × 1024
Wide:    1728 × 1117
```

Responsive design must recompose content. Do not merely shrink desktop screens.

---

# 9. Authoritative Application Shell

Use Stitch layout ID `12495258549845976462` as the authoritative structural reference.

## 9.1 Desktop sidebar

- Persistent left sidebar from 1024 px upward.
- Width: 240 px.
- White background.
- Right border using `color-border`.
- Logo region: 72 px high.
- Navigation begins 16 px below the logo region.
- Navigation item height: 44 px.
- Navigation item radius: 10 px.
- Profile and plan area near the bottom.
- Independent sidebar scrolling only when required by viewport height.

Primary navigation order:

```text
Today
Habits
Review
Insights
More
```

Supporting destinations may include:

```text
Reminders
Settings
Subscription
Help
Account
```

Selected navigation item:

- background `emerald-50`;
- icon and label `emerald-700`;
- weight 600;
- optional 3 px left indicator;
- visible focus state.

Do not use icon-only primary navigation.

## 9.2 Desktop top bar

- Height: 64 px.
- Supports page title context, notification or system-status action, and profile access.
- Page-specific actions may appear on the right.
- Do not duplicate navigation available in the sidebar.

## 9.3 Mobile top bar

- Minimum height: 56 px.
- Page title on the left.
- Maximum one or two icon actions on the right.
- No persistent sidebar.
- Do not duplicate the bottom-navigation destinations.

## 9.4 Mobile bottom navigation

- Fixed to the bottom.
- Height: 64 px plus safe-area inset.
- White background.
- Top border.
- Five equal-width items.
- Icon size: 20 px.
- Label size: 11–12 px.
- Selected item uses emerald icon and label.
- Page content includes at least 88 px bottom padding.
- No floating center action that obscures content.

## 9.5 Page header

Standard page header includes:

- optional eyebrow or breadcrumb;
- page title;
- optional one-sentence support text;
- primary page action;
- optional secondary actions;
- optional status badge.

Desktop places title and actions in one row when space permits.

Mobile stacks title, supporting text, and a full-width primary action where necessary.

---

# 10. Icon System

Use one rounded line-icon family throughout the application. Prefer Lucide-style icons.

## 10.1 Sizes

```text
16 px: compact metadata
18 px: buttons and inputs
20 px: navigation and standard cards
24 px: large action and empty state
32 px: limited feature illustration support
```

Use a consistent 1.75–2 px stroke at 20–24 px.

## 10.2 Approved icon semantics

| Meaning      | Icon direction                          |
| ------------ | --------------------------------------- |
| Today        | Home                                    |
| Habits       | List checks or sprout                   |
| Review       | Clipboard check                         |
| Insights     | Bar chart                               |
| More         | Ellipsis or menu                        |
| Reminders    | Bell                                    |
| Settings     | Settings                                |
| Full         | Check circle                            |
| Minimum      | Leaf or small check circle              |
| Skipped      | Minus circle                            |
| Recovery     | Life buoy, shield-heart, or heart pulse |
| Premium      | Crown                                   |
| Offline      | Cloud off                               |
| Pending sync | Refresh or cloud upload                 |
| Conflict     | Split arrows or merge warning           |
| Edit         | Pencil                                  |
| Delete       | Trash                                   |
| Information  | Info circle                             |
| Warning      | Alert triangle                          |
| Error        | Alert circle                            |

## 10.3 Icon rules

- Use the same icon for the same action across all screens.
- Do not mix filled, outlined, sharp, and rounded icon families.
- Preserve icon size, stroke width, alignment, and padding.
- Important actions require text labels.
- Icon-only controls require accessible names and desktop tooltips.
- Do not use flames as the primary product metaphor.

---

# 11. Core Components

## 11.1 Buttons

### Primary

- Background: `color-primary`.
- Text: white after contrast verification.
- Height: minimum 44 px desktop, 48 px touch.
- Horizontal padding: 16–20 px.
- Radius: 10 px.
- Hover: `color-primary-hover`.
- Pressed: `color-primary-pressed`.
- Focus: visible emerald focus ring.
- Disabled: muted surface, muted text, no misleading hover.
- Loading: spinner plus stable button width.

Use one primary action per panel or decision area.

### Secondary

- Background: `emerald-50`.
- Text: `emerald-700`.
- Optional border: `emerald-200`.
- Same dimensions as primary.

### Outline

- White background.
- Standard border.
- Primary or neutral text.
- Neutral or emerald soft hover surface.

### Ghost

- Transparent background.
- Neutral or emerald text.
- Subtle hover surface.

### Destructive

- Coral may be used for final irreversible confirmation.
- Entry actions should use outline or ghost destructive styling.
- Button label must name the consequence, such as `Delete account`.

### Icon button

- Minimum 40 × 40 px.
- Touch target minimum 44 × 44 px.
- Tooltip for unlabeled desktop controls.
- Accessible name always required.

## 11.2 Cards

Standard card:

- white background;
- 1 px standard border;
- 14 px radius;
- 20–24 px desktop padding;
- 16 px mobile padding;
- no shadow or `shadow-1`;
- clear header, body, and footer zones.

Supported variants:

```text
Standard
Selectable
Selected
Locked
Warning
Recovery
Premium
Disabled
Skeleton
```

## 11.3 Habit card

Content order:

1. habit icon or category marker;
2. habit name;
3. schedule and target summary;
4. lifecycle or status badge when relevant;
5. consistency indicator;
6. daily action group or card action;
7. synchronization or warning metadata only when relevant.

Today variant:

- Full and Minimum are visible actions.
- Skipped is lower emphasis but still discoverable.
- Recorded state replaces actions with result and Edit.
- Pending sync uses a compact blue queued indicator.
- Card remains usable at 320 px width.

Habits-list variant:

- lifecycle status;
- next schedule;
- consistency summary;
- card body opens Habit Details;
- secondary management actions live in a menu.

## 11.4 Check-in action group

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

- Full is primary by default.
- Minimum is a positive success option.
- Skipped uses neutral styling.
- Every option includes a text label.
- Offline confirmation may show pending synchronization.
- Do not use red for ordinary Skipped.

## 11.5 Status badges

Badge structure:

- optional icon;
- short text label;
- soft semantic surface;
- optional semantic border;
- height 24–28 px;
- radius pill or small radius.

Approved labels include:

```text
Guest
Free
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

## 11.6 Form controls

Inputs, selects, textareas, radio buttons, checkboxes, and switches must use:

- 44 px minimum control height;
- 48 px minimum mobile primary input height where practical;
- 10 px radius;
- standard border;
- explicit label above the field;
- helper text below when needed;
- inline validation without layout collapse;
- visible focus ring;
- error icon and message, not red border alone;
- disabled explanation where the reason is not obvious.

Do not use placeholder text as the only label.

## 11.7 Dialogs and drawers

Dialogs:

- use 18 px radius;
- maximum width 640 px by default;
- clear heading;
- concise explanation;
- explicit action labels;
- Cancel action for destructive decisions;
- focus trap;
- Escape closes only when safe;
- background content remains visible but inactive.

Mobile may use a bottom sheet or full-screen dialog where content density requires it.

## 11.8 Banners and alerts

Banner structure:

- semantic icon;
- heading or strong label;
- concise explanation;
- optional inline action;
- optional dismiss control;
- stable position below the application top bar.

Priority:

1. security or account action required;
2. payment or entitlement action required;
3. synchronization failure;
4. offline mode;
5. notification permission status;
6. general information.

Show only one persistent highest-priority global banner at a time.

## 11.9 Empty states

Empty states include:

- relevant line icon or restrained illustration;
- concise title;
- one supportive explanation;
- one primary action;
- optional secondary action;
- no blame-oriented language.

## 11.10 Loading states

- Preserve final component dimensions.
- Use skeletons matching actual text, card, and control positions.
- Keep navigation and stable controls visible.
- Avoid full-screen spinners when partial content can remain visible.
- Do not create large layout shifts after loading.

---

# 12. Operational States

Default is the original approved screen in its normal, loaded, connected, usable condition.

Generate state variants only when relevant to a screen.

## 12.1 Default

- Data is loaded.
- Connection is normal.
- No unresolved error or conflict exists.
- Features are available according to entitlement.
- The approved screen layout is visible.

## 12.2 Empty

- Preserve the page header and application shell.
- Replace the content region with a focused empty state.
- Explain what is absent and what the user can do next.
- Do not present emptiness as failure.

## 12.3 Loading

- Preserve layout and dimensions.
- Use matching skeleton placeholders.
- Keep stable navigation visible.
- Disable actions requiring loaded data.

## 12.4 Error

- Keep existing content visible where safe.
- Show error near the affected region.
- Include icon, heading, description, and Retry action where applicable.
- Do not communicate failure using red alone.

## 12.5 Offline

- Preserve locally available content.
- Show a non-blocking offline banner.
- Explain which actions remain available.
- Indicate when changes are stored locally and will synchronize later.
- Use cloud-off icon and explicit `Offline` text.

## 12.6 Pending sync

- Preserve the optimistic result.
- Show a compact blue synchronization indicator.
- Use text such as `Saved on this browser — waiting to sync`.
- Do not claim the change is synchronized before confirmation.

## 12.7 Conflict

- Preserve the original screen behind the conflict interface.
- Use an existing dialog, drawer, or inline panel.
- Explain what changed.
- Provide explicit actions such as `Keep Mine`, `Use Latest Version`, or `Review Changes`.
- Never overwrite silently.

## 12.8 Premium locked

- Preserve surrounding content and context.
- Clearly identify the locked capability.
- Explain the Premium value without manipulative urgency.
- Provide `View Premium` or equivalent action.
- Do not block core Guest or Free functionality unnecessarily.

## 12.9 Disabled

- Preserve control position and dimensions.
- Use muted surface and text.
- Remove hover and pressed states.
- Provide an explanation when the reason is not obvious.
- Do not rely only on reduced opacity.

## 12.10 Destructive confirmation

- Preserve the existing screen behind a dialog.
- State the affected item and consequence.
- Explain whether the action can be undone.
- Provide explicit `Cancel` and named destructive action.
- Require additional confirmation for irreversible account deletion.
- Use icon, heading, explanation, and color together.

## 12.11 Operational state consistency rule

When generating state variants:

- preserve navbar;
- preserve active navigation;
- preserve icons;
- preserve page header;
- preserve content width;
- preserve grid;
- preserve card placement;
- preserve typography;
- preserve spacing;
- preserve border radius;
- preserve component dimensions;
- minimize layout shifting;
- do not redesign the screen;
- do not change the screen into a different state.

---

# 13. Core Screen Layout Rules

## 13.1 Today Dashboard

Priority order:

1. page title, greeting, and date;
2. concise daily progress summary;
3. action-required notice when relevant;
4. scheduled session cards;
5. supporting insights or upcoming items.

Full and Minimum actions must be directly visible on session cards.

Do not bury daily check-ins inside menus.

## 13.2 Create Habit

Create Habit uses three connected screens:

1. Basic information.
2. Schedule and Minimum version.
3. Review and Create.

Requirements:

- maximum form width 720 px;
- visible progress indicator;
- consistent page header;
- stable Back and Continue positions;
- mobile primary action remains reachable;
- field validation does not shift the full page;
- user input remains preserved when navigating back;
- Disabled, Error, and Offline states remain visually consistent across all three screens.

## 13.3 Habit Details

Include:

- habit identity and lifecycle status;
- current Full and Minimum definitions;
- schedule summary;
- recent check-in history;
- consistency summary;
- version history access;
- edit and management actions;
- sync status only when relevant.

Relevant states:

```text
Default
Loading
Error
Offline
Conflict
Destructive confirmation
```

## 13.4 Check-in Flow

Connected flow:

```text
Today
→ Full / Minimum / Skipped
→ Optional Friction Reason
→ Check-in Confirmation
→ Updated Today
```

Minimum must look successful.

Skipped must use neutral treatment and supportive copy.

## 13.5 Recovery Plan

Use purple accents.

Include:

- calm introduction;
- observed signal;
- recommended smaller action;
- three-session default duration;
- explanation of why the recommendation may help;
- Apply;
- Customize;
- Keep Current where applicable.

Do not use diagnostic or crisis language.

## 13.6 Weekly Review

Include:

- weekly outcome summary;
- Full, Minimum, Skipped, and Unrecorded breakdown;
- friction summary;
- transparent recommendation;
- Apply;
- Customize;
- Keep Current.

Use direct values and labels in charts.

## 13.7 Insights

Insights must be informative without turning the product into a punitive scoreboard.

Use:

- direct labels;
- compact charts;
- period filters;
- plain-language interpretation;
- accessible legends;
- neutral treatment of difficult periods.

## 13.8 Subscription

Use Premium gold accents sparingly.

Do not allow Premium styling to overpower the primary application design.

Pricing and upgrade content must remain clear, factual, and non-manipulative.

---

# 14. Responsive Behavior

## 14.1 Desktop

- Persistent 240 px sidebar.
- Main content uses a maximum width of 1280 px.
- Two-column and three-column card layouts are permitted.
- Primary actions may align with page titles.
- Hover states supplement, but do not replace, visible actions.

## 14.2 Tablet

- Bottom navigation replaces sidebar below 1024 px.
- Compact top header.
- One or two columns depending on content.
- Forms remain centered and readable.
- Dialogs may become wider sheets where necessary.

## 14.3 Mobile

- Single-column composition by default.
- Bottom navigation remains fixed.
- Content receives at least 88 px bottom padding.
- Primary actions may become full width.
- Card actions stack without horizontal scrolling.
- Dialogs may become bottom sheets or full-screen overlays.
- Tables become cards or horizontally scrollable only when semantic structure is preserved.
- Do not compress the desktop sidebar into a narrow icon rail.

## 14.4 Zoom and reflow

At 200% zoom:

- content must reflow;
- controls must not overlap;
- navigation remains usable;
- dialogs remain reachable;
- state messages remain visible;
- no essential action is clipped.

---

# 15. Accessibility Contract

All screens must support:

- keyboard navigation;
- visible focus indicators;
- semantic headings;
- explicit labels;
- accessible names for icon-only controls;
- logical reading order;
- status announcements;
- sufficient contrast;
- 200% zoom;
- reduced motion;
- touch targets;
- error identification beyond color.

## 15.1 Contrast

- Normal text: at least 4.5:1.
- Large text: at least 3:1.
- Component boundaries and focus indicators: at least 3:1 where applicable.
- Verify white text on emerald primary before final approval.
- Amber, blue, and purple soft surfaces use dark neutral text.

## 15.2 Targets

- Desktop pointer target: at least 40 × 40 px.
- Touch target: at least 44 × 44 px.
- Mobile primary control: at least 48 px high.
- Adjacent touch targets: at least 8 px separation unless intentionally segmented.

## 15.3 Status communication

Every operational or semantic state must include at least two of:

- text;
- icon;
- shape;
- position;
- border;
- color.

Color alone is never sufficient.

---

# 16. Content and Tone

Use concise, supportive, factual language.

Preferred language:

- `Full`;
- `Minimum`;
- `Skipped`;
- `Skipped — not recorded`;
- `Recovery plan`;
- `Needs Review`;
- `Stored only in this browser`;
- `Saved on this browser — waiting to sync`;
- `Apply`;
- `Customize`;
- `Keep Current`.

Avoid:

- `You failed`;
- `You broke your streak`;
- `Bad performance`;
- `You must recover now`;
- psychological diagnosis;
- shame;
- aggressive urgency;
- manipulative Premium messaging.

Button labels must name the action, not use vague labels such as `OK` when a clearer action is available.

---

# 17. Stitch Generation Rules

For every new screen:

1. Use layout ID `12495258549845976462` as the application-shell reference.
2. Use this `DESIGN.md` as the visual authority.
3. Preserve the navigation order and icon system.
4. Use the correct active navigation item.
5. Generate desktop 1440 px and mobile 390 px variants.
6. Generate tablet 1024 px where layout behavior is not obvious.
7. Create the Default screen first.
8. Refine the Default screen before generating operational states.
9. Generate only operational states relevant to that screen.
10. Preserve content and state when updating an existing screen.
11. Do not create a new design language for individual screens.
12. Do not mix icon families.
13. Do not introduce dark mode.
14. Do not replace emerald primary with Material defaults.
15. Do not use color alone for status.

## 17.1 Update existing screen rule

When updating an existing screen to match layout ID `12495258549845976462`:

- keep all existing content;
- keep data and field values;
- keep operational state;
- keep state-specific messages;
- keep buttons and actions;
- keep dialogs, banners, skeletons, and alerts;
- update only shell, navbar, icons, spacing, typography, shared components, and responsive layout;
- do not copy the reference screen’s content;
- do not remove state-specific components.

---

# 18. Consistency Checklist

A screen is visually approved only when all items pass.

## Layout

- Uses the approved application shell.
- Uses the correct active navigation item.
- Matches layout ID `12495258549845976462`.
- Uses the approved content width and grid.
- Preserves hierarchy at desktop and mobile sizes.
- Does not create unnecessary layout shifting.

## Color

- Uses semantic tokens.
- Uses emerald for primary actions and selected navigation.
- Uses amber for Minimum and limited Premium emphasis.
- Uses purple for Recovery.
- Uses blue for information and synchronization.
- Uses coral only for error or destructive meaning.
- Does not communicate status through color alone.

## Typography

- Uses Inter/system sans-serif.
- Uses sentence case.
- Uses the approved type scale.
- Does not use text below 12 px.
- Maintains readable line length.

## Components

- Uses shared button, card, form, badge, banner, dialog, and navigation patterns.
- Uses one icon family.
- Maintains stable component dimensions across states.
- Uses visible focus states.
- Uses explicit labels for important actions.

## Responsive behavior

- Desktop uses the persistent sidebar.
- Tablet and mobile use bottom navigation.
- Mobile is recomposed, not merely scaled.
- Primary actions remain reachable.
- Content remains usable at 320 px and 200% zoom.

## Product tone

- Minimum appears as success.
- Skipped remains neutral.
- Recovery remains supportive.
- Recommendations preserve user control.
- No shame, diagnosis, or punitive streak language appears.

---

# 19. Final Design Direction

The final interface must look like one coherent product built from a single design system.

It must combine:

- emerald-green primary actions;
- white cards;
- soft gray-green page backgrounds;
- restrained amber, purple, blue, and coral semantic accents;
- rounded line icons;
- persistent desktop sidebar;
- mobile bottom navigation;
- clear hierarchy;
- stable operational states;
- accessible interactions;
- supportive Recovery-first language.

The visual result should feel calm and dependable rather than gamified, clinical, or punitive.
