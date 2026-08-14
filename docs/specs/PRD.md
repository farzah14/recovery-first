# Recovery-First Habit Tracker

## Web Product Requirements Document and Functional Specification

*A responsive web habit system designed to help people start, sustain, adapt, and recover without punitive streak mechanics.*

| **Document status** | Greenfield product definition / pre-development specification |
|---|---|
| **Version** | 1.0 |
| **Product stage** | Greenfield concept / no implementation started / MVP definition |
| **Working product name** | Recovery-First Habit Tracker |
| **Primary platform** | Responsive web application and installable PWA |
| **Business model** | Freemium subscription |
| **Prepared** | 28 July 2026 |

> **Greenfield scope**
>
> This document defines the first implementation of the product. No existing application, production system, user database, legacy architecture, or prior platform migration is assumed.

> **Core product promise**
>
> The system does not punish users for imperfect execution. It preserves useful history, identifies friction, proposes the smallest helpful adjustment, and gives the user final control over every meaningful change.

# Document Map

1. [Executive Summary](#1-executive-summary)
2. [Product Context and Strategy](#2-product-context-and-strategy)
3. [Users, Jobs, and Product Principles](#3-users-jobs-and-product-principles)
4. [Scope, Plans, and Entitlements](#4-scope-plans-and-entitlements)
5. [Information Architecture and Core Journeys](#5-information-architecture-and-core-journeys)
6. [Functional Requirements](#6-functional-requirements)
7. [Habit State Model and Business Rules](#7-habit-state-model-and-business-rules)
8. [Data and System Behavior](#8-data-and-system-behavior)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Analytics and Product Success](#10-analytics-and-product-success)
11. [Acceptance Criteria by Epic](#11-acceptance-criteria-by-epic)
12. [MVP Delivery Scope and Roadmap](#12-mvp-delivery-scope-and-roadmap)
13. [Risks, Dependencies, and Validation Hypotheses](#13-risks-dependencies-and-validation-hypotheses)
14. [Appendix: Terminology and Reference Flows](#14-appendix-terminology-and-reference-flows)

> **How to use this document**
>
> Sections 1–5 define the product and MVP boundary. Sections 6–8 are the implementation-facing functional specification. Sections 9–13 define quality gates, analytics, release scope, and validation work.

# 1. Executive Summary

Recovery-First Habit Tracker is a responsive web SaaS product for individuals who struggle not only to begin habits, but also to maintain them and return after disruption. The product replaces punitive streak logic with flexible continuity, consistency measurement, friction capture, guided adaptation, and explicit recovery workflows.

The core interaction loop is:

> **Core loop**
>
> Design → Do → Check-in → Identify friction → Adapt → Recover

The MVP is account-first. A user authenticates before entering the application and receives a Free account with cloud backup, cross-device synchronization, and secure recovery. Lite expands capacity and recovery guidance; Premium unlocks adaptive programs, advanced analysis, and the highest active-habit limit. The product must remain useful on the Free tier; the core recovery philosophy cannot be fully paywalled.

## 1.1 Product thesis

- Most habit tools optimize for streak preservation; this product optimizes for recovery quality and sustainable consistency.

- Minimum versions count as successful continuity, not partial failure.

- A missed session is useful diagnostic data when the product asks for one simple friction reason.

- Adaptation is proposed, explained, and approved by the user rather than silently applied.

- Historical progress remains intact when a habit is redesigned, restored, paused, stopped, archived, or downgraded from Premium.

- The website should remain useful during temporary connectivity loss, without pretending that every web capability can work indefinitely offline.

## 1.2 MVP outcome

A first-time visitor should be able to create an account, create a habit, understand Full / Minimum / Skipped, optionally configure reminders, complete check-ins, recover after repeated misses, and review progress.

A returning user should be able to understand why the system is making a recommendation and retain control over whether that recommendation changes the habit.

A signed-in user should be able to continue across supported browsers and devices without losing approved history or creating duplicate sessions.

## 1.3 Primary differentiation

| **Traditional habit tracker** | **Recovery-first system** |
|---|---|
| Streak resets after failure | History remains; continuity and consistency are measured separately |
| One target for every context | Normal, Minimum, and fallback versions |
| Missed days are punitive | Missed sessions become friction signals and recovery inputs |
| Automatic optimization may feel opaque | One explained recommendation requiring user approval |
| Editing destroys prior context | Versioned redesign preserves lifetime history |
| Connectivity interruption blocks progress | Supported actions queue locally and synchronize safely later |

# 2. Product Context and Strategy

## 2.1 Problem statement

Users commonly fail at habit formation for three distinct reasons: the initial target is too difficult to start, the habit is too rigid to survive changing energy or schedules, and existing tools make returning after failure emotionally costly. The product must address all three stages rather than focusing only on daily completion.

## 2.2 Product vision

Create a personal behavior system that helps users build realistic routines, recognize friction early, make small evidence-based adjustments, and recover without losing the meaning of past effort.

## 2.3 Product goals

- Reduce time from first website visit to first usable habit.

- Make Minimum completion an explicit, respected success state.

- Detect repeated difficulty without overreacting to isolated missed or unrecorded sessions.

- Provide a structured recovery plan after three consecutive manually recorded Skipped sessions.

- Keep all major habit changes reversible through version history.

- Preserve signed-in progress across supported browsers and provide a safe recovery path for legacy browser-local data.

- Convert Free users to Lite and Premium through demonstrated value rather than deceptive or punitive prompts.

- Deliver a consistent experience across desktop, laptop, tablet, and mobile browsers.

## 2.4 Non-goals for MVP

- Team, coach, family, classroom, or social accountability features.

- Public leaderboards, competitive streaks, or social feeds.

- Medical, therapeutic, or diagnostic claims.

- Wearable integrations, health-platform synchronization, or automatic activity detection.

- Native Android or iOS applications.

- Browser extensions.

- Public API access for third-party developers.

- AI-generated coaching conversations as a core interaction surface.

- Complex enterprise administration, organization accounts, or role-based workspaces.

- Full offline parity for cloud-only operations such as account creation, payment, entitlement reconciliation, and cross-device synchronization.

## 2.5 Product principles

| **Principle** | **Required behavior** |
|---|---|
| Recovery over punishment | Do not erase historical progress because of a missed session. |
| User control | Suggestions support Apply, Customize, or Keep Current where they alter behavior. |
| Smallest useful change | Change one relevant variable at a time. |
| Contextual permission | Ask for account, browser notification, email reminder, or payment only when the benefit is clear. |
| Explainability | Every recommendation includes the observed signal and expected benefit. |
| Data preservation | Pause, stop, downgrade, redesign, and restore retain history. |
| Progressive complexity | First-time flows expose only the decisions needed to start. |
| Responsive clarity | Layout changes across screen sizes without changing the underlying mental model. |
| Browser honesty | Clearly explain limits caused by browser storage, permissions, connectivity, or unsupported capabilities. |

# 3. Users, Jobs, and Product Principles

## 3.1 Primary user

An individual who wants to build one or more habits but has difficulty with consistency, changing schedules, low-energy days, or returning after a lapse. The user may prefer to try the product anonymously in a browser before creating an account.

## 3.2 Core jobs to be done

| **Job** | **Success condition** |
|---|---|
| Start a habit | Create a realistic Normal and Minimum version in a few minutes. |
| Complete today's habit | Check in with one clear action and minimal cognitive load. |
| Handle a difficult day | Use Minimum without feeling that the habit failed. |
| Understand a miss | Record one main friction reason or skip the explanation. |
| Recover after disruption | Use a short plan, then return to the Normal target. |
| Adjust without losing history | Create a new version while preserving lifetime activity. |
| Review progress | See consistency, continuity, and only the habits needing attention. |
| Continue on another device | Sign in and safely synchronize cloud-backed data. |
| Continue during an outage | Record supported actions locally and synchronize them later. |

## 3.3 User trust requirements

- No silent habit redesigns.

- No automatic trial start.

- No deletion of history when Premium ends.

- No repeated browser-notification permission harassment.

- No automatic classification of a missed check-in as a behavioral failure until the three-day Unrecorded window ends.

- No recommendation presented as a psychological diagnosis.

- No hidden transfer of legacy local data into an account without explicit user action.

- No misleading claim that legacy local data is backed up or available across devices.

- No payment-state change based only on client-side browser data.

- No sensitive habit names, notes, or free-text friction content sent to analytics.

# 4. Scope, Plans, and Entitlements

## 4.1 User states and active-habit limits

| **User state** | **Active habits** | **Storage / synchronization** | **Premium access** |
|---|---:|---|---|
| Free account | 5 | Cloud backup and basic cross-device synchronization | Basic recovery and review |
| Lite account | 10 | Cloud backup and cross-device synchronization | Enhanced recovery and capacity analysis |
| Premium account | 30 | Cloud backup and synchronization | Full Premium programs and analysis |

Paused, Stopped, Completed, Archived, Trash, and Decision Required items do not consume active-habit slots. Draft handling must not allow users to bypass active limits; a Draft becomes slot-consuming only when activated.

## 4.2 Feature entitlement matrix

| **Capability** | **Free** | **Lite** | **Premium** |
|---|---|---|---|
| Basic templates | Yes | Yes | Yes |
| Custom habits | Yes | Yes | Yes |
| Full / Minimum / Skipped check-ins | Yes | Yes | Yes |
| In-app reminder schedule | Yes | Yes | Yes |
| Web Push reminders | Where browser support and permission allow | Where browser support and permission allow | Where browser support and permission allow |
| Email reminder fallback | No | Basic | Configurable |
| Recovery Mode | Basic | Enhanced guidance | Full adaptive guidance |
| Weekly Review | Basic | Capacity analysis | Advanced insights |
| Adaptive program | Preview | Preview | Yes |
| Adaptive reminder analysis | No | Basic capacity analysis | Yes |
| Cloud backup / synchronization | Yes | Yes | Yes |
| Active-habit limit | 5 | 10 | 30 |

## 4.3 Free, Lite, and Premium commercial model

- Free is an account tier with no subscription charge.

- Lite and Premium are available as monthly and annual subscription plans.

- A 14-day trial is available for either paid plan.

- The user must create or sign in to an account before using the application or starting a trial.

- The user must explicitly choose a plan; no plan is selected by default.

- Checkout is completed through the approved website payment provider.

- The trial begins only after the user confirms the selected plan and the backend records a valid trial entitlement.

- The trial converts to the selected paid plan unless cancelled under the disclosed subscription terms.

- Lite pricing is $5 per month or $48 per year.

- Premium pricing is $10 per month or $96 per year.

- Final provider product identifiers remain configured in the billing implementation, not in browser code.

- The payment architecture must allow the payment provider to be changed without rewriting product entitlement rules.

## 4.4 Subscription status model

| **Status** | **Entitlement behavior** |
|---|---|
| Trial Active | Premium enabled until trial end or authoritative payment state changes. |
| Trial Cancelled | Premium remains until the trial entitlement expires. |
| Active | Premium enabled. |
| Grace Period | Premium remains enabled during an approved payment-recovery window. |
| Past Due | Access follows backend entitlement policy; payment issue is visible without deleting data. |
| Cancelled | Auto-renewal is off; Premium remains until the paid entitlement expiry. |
| Expired | Downgrade workflow begins. |
| Refunded | Premium is disabled when the authoritative entitlement is removed. |
| Revoked | Premium is disabled immediately when the authoritative entitlement is revoked. |

## 4.5 Public and authenticated web surfaces

The website contains two product surfaces:

1. A public surface for landing, pricing, authentication, help, legal, and status information.
2. An application surface for Today, Habits, Review, Insights, Reminders, Settings, account management, and subscription management.

Public pages must not expose private habit data. Authenticated application pages must not be indexed by search engines.

# 5. Information Architecture and Core Journeys

## 5.1 Desktop and laptop primary navigation

The authenticated application uses a persistent left sidebar on laptop and desktop widths.

| **Navigation item** | **Purpose** |
|---|---|
| Today | Current scheduled sessions, check-ins, contextual banners, and daily status. |
| Habits | Habit list, creation, lifecycle management, history, versions, and details. |
| Review | Weekly Review, Recovery, At Risk, Check-in Review, and pending decisions. |
| Insights | Consistency, continuity, patterns, and progress views. |
| Reminders | Reminder schedules, permission state, email fallback, and quiet hours. |
| Settings | Appearance, locale, time, privacy, export, account, and accessibility preferences. |

A persistent Add Habit button appears in the sidebar or page header on Today and Habits. It opens a responsive creation surface: a dialog on larger screens and a full-height drawer on smaller screens.

## 5.2 Tablet and mobile-web navigation

Mobile web uses bottom navigation with:

- Today
- Habits
- Review
- Insights
- More

More opens access to Reminders, Settings, Help, Account, Subscription, Export Data, and Sign Out where applicable.

The active destination, browser Back/Forward navigation, deep links, and page refresh must remain consistent.

## 5.3 Profile and account menu

The top-right profile control opens an anchored account menu on larger screens and a drawer on smaller screens. It shows the current account and plan state and links to Account, Subscription, Settings, Help, Export Data, and Sign Out as applicable.

Delete Account remains inside Account Settings and requires a separate confirmation flow.

## 5.4 Core journey: first habit

1. Visit the website and create or sign in to an account.
2. Choose a goal category.
3. Select a basic template or create a custom habit.
4. Define the Normal version and Minimum version.
5. Choose schedule and cue.
6. Optionally enable a reminder.
7. If Web Push is chosen, show a contextual pre-permission explanation before the browser permission prompt.
8. Review the configuration and create the habit.
9. Arrive on Today and receive non-blocking guidance for the first check-in.

## 5.5 Core journey: legacy local data recovery

1. The user signs in while a legacy browser-local dataset is detected.
2. The product explains the dataset's local-only status and offers transfer or export.
3. The user confirms the transfer with Google or email magic link / OTP.
4. The system validates the callback and resumes the original context.
5. Legacy local data is copied to the account through a transactional transfer.
6. If cloud data already exists, the user receives a safe merge summary before confirmation.
7. Browser-local data is retained until the server confirms a successful transfer.

## 5.6 Core journey: recovery

1. Three consecutive scheduled Manual Skipped sessions occur.
2. A Recovery prompt is shown without blocking unrelated application use.
3. The system recommends one plan based on the dominant friction signal.
4. The user selects Apply, Customize, Keep Current, or Later where eligible.
5. Recovery runs for three scheduled sessions by default.
6. Success returns the user to the Normal target; failure creates a lighter plan.
7. Two failed Recovery Plans move the habit to Needs Review.

## 5.7 Core journey: Premium preview

1. A Free or Lite user opens Premium Programs.
2. Locked programs remain visible with Preview actions.
3. The user sees description, benefits, and Days 1–3.
4. The user simulates Full, Minimum, or Skipped outcomes.
5. One relevant variable changes per simulated day.
6. The simulated recommendation requires Apply, Customize, or Keep Current.
7. The preview ends with View Plans, Use Basic Template, or Close.

## 5.8 Core journey: subscription

1. The user opens Pricing or Subscription.
2. Monthly and annual plans are displayed without a preselected option.
3. The user selects a plan and sees the exact trial, first billing date, renewal, cancellation, and refund disclosures.
4. The user confirms checkout.
5. The payment provider completes or redirects the user back to the website.
6. The browser shows a pending state until the backend verifies the authoritative payment event.
7. Lite or Premium is enabled only after entitlement confirmation.
8. The subscription page displays status, next billing or expiry date, plan management, cancellation, and refresh-status actions.

## 5.9 Core journey: temporary offline use

1. The browser loses connectivity after the application has loaded previously.
2. The website displays a persistent non-blocking Offline banner.
3. Cached Today, Habits, and recent history remain available where local data exists.
4. Supported check-ins and draft changes are recorded in a local pending queue.
5. Account, payment, entitlement, email, and cloud-only actions clearly show that connectivity is required.
6. When connectivity returns, pending operations synchronize idempotently.
7. Any conflict is surfaced without silently deleting user history.

# 6. Functional Requirements

## 6.1 Public website, account entry, and account conversion

### FR-PUB-01 — Public website

The product shall provide public Landing, Pricing, Sign In, Help, Privacy, Terms, Cookie, Refund, and Status pages.

**Acceptance:** Public pages are usable without authentication, responsive, and contain no private application data.

### FR-PUB-02 — Application entry

The primary Start action shall allow the visitor to create or sign in to an account.

**Acceptance:** Public pages explain that account creation is required before entering private application routes.

### FR-ONB-01 — Account-first entry

The application shall require an authenticated account before habit tracking.

**Acceptance:** A first-time visitor is sent through account creation or sign-in, receives a Free profile, and can then create and check in to a habit.

### FR-ONB-02 — Progressive habit wizard

The first-habit wizard shall collect goal, habit/template, Normal version, Minimum version, schedule/cue, optional reminder, and final confirmation.

**Acceptance:** Each step has one primary decision, supports Back, preserves prior entries, and is keyboard-operable.

### FR-ONB-03 — Contextual account request

The application shall resolve the account and entitlement before private application access; it shall request upgrades only when the user seeks Lite or Premium capabilities.

**Acceptance:** Closing the account prompt returns the user to the prior context without data loss.

### FR-ONB-04 — First check-in guidance

The Today page shall display non-blocking interactive guidance for Full, Minimum, and Skipped on the first check-in.

**Acceptance:** The guide can be skipped, does not return automatically after completion, and remains available from Help.

### FR-ONB-05 — Legacy local data disclosure

The product shall explain that legacy browser-local data is not cloud-backed and may be lost if browser data is cleared.

**Acceptance:** The disclosure appears before transfer, export, or clearing of legacy local data.

### FR-ONB-06 — Authentication methods

The product shall support Google authentication and email magic link or OTP authentication.

**Acceptance:** Authentication returns the user to the initiating route and safely handles expired, reused, malformed, or cancelled callbacks.

### FR-ONB-07 — Session expiration

When an authenticated session expires, the application shall preserve unsynchronized local work and request re-authentication without exposing private data.

**Acceptance:** Successful re-authentication resumes the prior safe context and retries eligible pending operations.

### FR-ONB-08 — Password reset

The product shall support password reset through a Supabase Auth recovery link for email/password accounts.

**Acceptance:**

- The sign-in surface exposes a `Forgot password?` entry that never reveals whether an email address has an account.
- The recovery link returns the user to a password-update page that requires a valid recovery session.
- The new password requires at least 8 characters and a matching confirmation, with inline validation.
- Expired, reused, or malformed recovery links fail safely back to a stable auth surface without changing the password.

### FR-ONB-10 — Device-based time settings

The application shall derive time and week-start settings from the user's device instead of requiring manual configuration.

**Acceptance:**

- The device timezone is detected automatically and applied to session generation and local-date calculations.
- The week-start day follows the device locale (Sunday, Monday, or Saturday) without user configuration.
- Detected settings sync to the profile on each application load and follow the device when the user's timezone or week start changes.
- Settings surfaces show the active timezone and label it as detected from the device.

## 6.2 Habit creation and structure

### FR-HAB-01 — Creation routes

The Add Habit action shall expose Choose Template, Create Custom, and Premium Programs.

**Acceptance:** The action is available on Today and Habits and uses a dialog on large screens and a drawer on small screens.

### FR-HAB-02 — Habit definition

A habit may include cue/context, Normal version, Minimum version, fallback, frequency/schedule, reminder, follow-up reminder, and recovery rule.

**Acceptance:** The system can create a valid habit with recommended defaults when optional advanced fields are omitted.

### FR-HAB-03 — Basic templates

Basic templates shall remain available to Free, Lite, and Premium users and demonstrate Normal, Minimum, cue, and fallback concepts.

**Acceptance:** A basic template is editable before activation and does not require Premium.

### FR-HAB-04 — Active-limit enforcement

The system shall enforce limits of 5 Free, 10 Lite, and 30 Premium active habits.

**Acceptance:** When the limit is reached, the Add flow explains the current tier limit and offers pause, upgrade, or draft actions as applicable.

### FR-HAB-05 — Draft preservation

Partially completed habit creation shall be preserved locally until submitted, discarded, or expired by the product retention policy.

**Acceptance:** Browser refresh, navigation away, or a temporary offline state does not silently erase an active draft.

## 6.3 Daily sessions and check-ins

### FR-CHK-01 — One-action check-in

Scheduled sessions shall support Full, Minimum, and Skipped directly from the Today habit card or row.

**Acceptance:** Full and Minimum save through one primary action; Skipped opens an optional friction step with a visible Skip Explanation action.

### FR-CHK-02 — Minimum success semantics

Minimum shall preserve continuity and count in consistency as successful completion.

**Acceptance:** Minimum is visually described as successful continuity and never labelled as failure.

### FR-CHK-03 — Friction capture

Skipped shall request one primary friction category: forgot, no time, too tired, target too heavy, schedule changed, environment, no motivation, or other.

**Acceptance:** The user can complete Skipped without choosing a reason.

### FR-CHK-04 — Same-day edit

A recorded check-in may be changed only before the end of the session's local calendar day.

**Acceptance:** The recalculated state updates consistency, continuity, reminders, Recovery counters, Weekly Review inputs, and synchronized data.

### FR-CHK-05 — Session timezone integrity

Each scheduled session shall retain the timezone used when it was created.

**Acceptance:** Browser, operating-system, or travel timezone changes do not move a historical session to another date.

### FR-CHK-06 — Optimistic confirmation

A supported check-in shall provide immediate local visual confirmation before cloud synchronization completes.

**Acceptance:** The UI distinguishes Saved, Pending Sync, Failed to Sync, and Conflict states without requiring the user to repeat a successful local action.

### FR-CHK-07 — Duplicate prevention

The same session shall not receive duplicate check-ins from retries, multiple browser tabs, refresh, or repeated clicks.

**Acceptance:** Repeated equivalent submissions resolve idempotently and preserve one authoritative check-in history.

## 6.4 Unrecorded and automatic classification

### FR-UNR-01 — Unrecorded state

A scheduled session with no check-in at daily cutoff shall become Unrecorded rather than Skipped.

**Acceptance:** Unrecorded is temporarily excluded from both the numerator and denominator of consistency.

### FR-UNR-02 — Three-day resolution window

The user may classify Unrecorded as Full, Minimum, Skipped, or Excused for three calendar days.

**Acceptance:** Late classification is timestamped and locked immediately after confirmation.

### FR-UNR-03 — Automatic Skipped

After the three-day window, Unrecorded shall become Automatic Skipped and lock permanently.

**Acceptance:** The record includes source=automatic and reason=not recorded within three days.

### FR-UNR-04 — Recovery exclusion

Automatic Skipped shall lower consistency but shall not increment the consecutive Manual Skipped counter.

**Acceptance:** Automatic Skipped alone cannot activate Recovery Mode.

### FR-UNR-05 — Check-in Review trigger

Three Automatic Skipped sessions within fourteen days shall create a Check-in Review.

**Acceptance:** The review analyzes schedule and reminder patterns and proposes one recommendation.

## 6.5 Reminder and notification behavior

### FR-REM-01 — Reminder channels

The product shall support in-app reminder state, Web Push where supported and permitted, and account-based email reminder fallback.

**Acceptance:** Habit creation and check-in remain usable when Web Push or email reminders are unavailable.

### FR-REM-02 — Contextual browser permission

The website shall request browser notification permission only when the user explicitly enables Web Push for the first time.

**Acceptance:** A product-owned pre-permission explanation appears before the browser permission prompt.

### FR-REM-03 — Denied or unsupported permission

If Web Push is denied, blocked, dismissed, or unsupported, the habit remains usable and reminder status shows unavailable.

**Acceptance:** The website offers browser-specific guidance where available, email fallback for eligible accounts, and Continue Without Web Push; it does not repeatedly trigger the browser prompt.

### FR-REM-04 — Primary and follow-up reminder

Each habit may have one primary reminder and one optional follow-up reminder, default off.

**Acceptance:** Full or Minimum cancels remaining scheduled reminders for that session where the active reminder channel supports cancellation.

### FR-REM-05 — Quiet hours

All reminders shall respect user-defined quiet hours.

**Acceptance:** A reminder falling inside quiet hours follows the configured defer/suppress behavior without generating duplicate reminders.

### FR-REM-06 — Adaptive suggestion

Premium may suggest a better reminder time based on usage patterns but shall not apply it automatically.

**Acceptance:** The suggestion provides Apply, Customize, and Keep Current.

### FR-REM-07 — Reminder reduction trial

When a habit becomes Stable, the system may suggest turning off the follow-up reminder while keeping the primary reminder.

**Acceptance:** The trial compares five eligible scheduled sessions before and five after the change.

### FR-REM-08 — Decline detection

The system shall suggest restoring the prior reminder if consistency drops by at least 20 percentage points or at least two Skipped sessions occur during the five-session trial.

**Acceptance:** Excused, Pause, unscheduled days, redesign, and Recovery are excluded or cancel the trial as defined.

### FR-REM-09 — Reminder delivery honesty

The product shall not claim guaranteed reminder delivery because browser, operating-system, battery, network, permission, and email-provider behavior may prevent or delay delivery.

**Acceptance:** Reminder settings explain channel status, last known delivery state where available, and the limits of each channel.

## 6.6 Consistency and continuity

### FR-MET-01 — Consistency rate

Consistency shall be calculated as (Full + Minimum) divided by eligible scheduled sessions.

**Acceptance:** Unrecorded pending sessions, Excused, Pause, and unscheduled days are excluded from eligible sessions.

### FR-MET-02 — Flexible continuity

Full and Minimum preserve current continuity; Manual Skipped and Automatic Skipped break current continuity; Excused neither lowers consistency nor preserves continuity.

**Acceptance:** Current continuity and lifetime history are displayed as separate concepts.

### FR-MET-03 — Version metrics

Current-version statistics shall restart when a redesign creates a new version, while lifetime metrics remain available.

**Acceptance:** The user can distinguish current-version performance from lifetime performance.

## 6.7 Stable status

### FR-STA-01 — Stable eligibility

A habit may be marked Stable only after at least eight evaluated scheduled sessions, at least 80% consistency, no three consecutive Manual Skipped sessions, no active Recovery, and no Recovery Mode in the last five sessions.

**Acceptance:** All criteria are evaluated together and are described as a product estimate, not a diagnosis.

### FR-STA-02 — Minimum-heavy stability

If Stable performance is dominated by Minimum completions, the product shall show “Stable — target review suggested.”

**Acceptance:** The status remains Stable while the user is offered a non-blocking target review.

## 6.8 Recovery Mode

### FR-REC-01 — Recovery trigger

Recovery Mode shall activate after three consecutive scheduled Manual Skipped sessions.

**Acceptance:** Unscheduled days, Excused, Pause, and Automatic Skipped do not increment the counter; Full or Minimum resets it.

### FR-REC-02 — Deferral

The first Recovery prompt may be deferred once with Later.

**Acceptance:** The prompt is shown again on the next eligible session; the second presentation includes Keep Current.

### FR-REC-03 — Recommendation source

The system shall recommend one recovery plan based on the dominant recorded friction.

**Acceptance:** If data is insufficient, the neutral plan is Minimum version for three scheduled sessions.

### FR-REC-04 — Plan duration

Recovery runs for three scheduled sessions by default and may be extended to five by the user.

**Acceptance:** The duration is expressed in eligible scheduled sessions, not calendar days.

### FR-REC-05 — Success threshold

Recovery succeeds with two or three successful Full/Minimum sessions out of three.

**Acceptance:** After success, the Normal target resumes on the next scheduled session and edit/pause options remain available.

### FR-REC-06 — Failed recovery

A recovery result of zero or one success out of three shall produce a lighter plan that changes one friction-relevant variable.

**Acceptance:** The same failed plan is not repeated unchanged.

### FR-REC-07 — Needs Review

After two consecutive failed Recovery Plans, the habit shall enter Needs Review.

**Acceptance:** The user chooses Redesign, Pause, Stop, or Keep Current; the product does not auto-pause or delete.

## 6.9 Weekly Review

### FR-WRV-01 — Fixed review day

Weekly Review shall occur on a fixed user-configurable weekday, default Sunday.

**Acceptance:** The review can be opened manually before the configured day.

### FR-WRV-02 — Review duration

The review shall target completion in two to five minutes.

**Acceptance:** The summary covers all habits, while detail is limited to habits needing attention.

### FR-WRV-03 — Priority order

Review items shall be ordered Recovery → At Risk → Check-in Review → Building.

**Acceptance:** If many habits require attention, the top three appear first and remaining insights are collapsible.

### FR-WRV-04 — Batch approval

Recommendations shall be unselected by default and support multi-select review before one confirmation action.

**Acceptance:** Applied changes begin at the next scheduled session.

### FR-WRV-05 — Reversibility

Applied changes shall be reversible at any time through Change History.

**Acceptance:** Restore creates a new version and never overwrites prior history.

## 6.10 Check-in Review

### FR-CIR-01 — Analysis scope

Check-in Review shall inspect reminder time, Web Push permission and capability, email reminder status, quiet hours, website-open timing, follow-up status, and schedule stability.

**Acceptance:** The system selects one recommendation with the strongest available signal.

### FR-CIR-02 — Presentation

The first Check-in Review shall appear as a non-blocking Today banner and remain in Weekly Review until resolved.

**Acceptance:** Review Now opens the analysis; Later permanently dismisses the banner but not the Weekly Review item.

### FR-CIR-03 — Resolution

A Check-in Review is resolved by Apply, Customize and Save, or Keep Current.

**Acceptance:** Later is not a resolution state.

## 6.11 Habit lifecycle, versioning, and deletion

### FR-LIF-01 — Lifecycle states

The product shall support Draft, Starting, Building, Active, Stable, At Risk, Recovery, Rebuilding, Needs Review, Paused, Stopped, Completed, Archived, Trash, and Decision Required.

**Acceptance:** Each state has explicit entry/exit rules and only eligible states consume active slots.

### FR-LIF-02 — Redesign versioning

Redesign shall create a new version of the same habit.

**Acceptance:** Historical activity and previous configuration remain accessible; current-version metrics start at zero.

### FR-LIF-03 — Restore behavior

Restoring or reverting shall always create another new version.

**Acceptance:** No prior version is overwritten or deleted.

### FR-LIF-04 — Soft delete

Delete shall move the habit to Trash for thirty days, stop reminders immediately, and hide it from Today.

**Acceptance:** The user can restore during the retention period; permanent deletion requires expiry or explicit confirmation.

### FR-LIF-05 — Trash restore

A restored Trash item shall return as Paused by default.

**Acceptance:** The user must explicitly reactivate it before future sessions are generated.

### FR-LIF-06 — Cross-tab consistency

Habit lifecycle changes performed in one browser tab shall propagate to other active tabs without creating duplicate transitions.

**Acceptance:** A stale tab cannot silently overwrite a newer confirmed lifecycle state.

## 6.12 Premium programs and preview

### FR-PRG-01 — Program format

Premium programs shall begin with a structured 7-, 14-, or 30-day plan and provide later adaptation suggestions based on performance.

**Acceptance:** Suggestions never change the program without user approval.

### FR-PRG-02 — Free preview visibility

Free and Lite users shall see Premium Programs with a lock indicator and Preview action.

**Acceptance:** The catalogue does not falsely imply that a locked program is active.

### FR-PRG-03 — Preview depth

The preview shall show description, benefits, and the first three days of the program.

**Acceptance:** Days beyond Day 3 remain locked.

### FR-PRG-04 — Interactive simulation

The first three preview days shall support non-persistent Full, Minimum, and Skipped simulations.

**Acceptance:** Simulation data is labelled, does not create real sessions, does not use slots, and is cleared when the preview resets or closes.

### FR-PRG-05 — Cross-day adaptation

Day 1 simulation choices shall influence Day 2 and Day 3.

**Acceptance:** Each day changes at most one relevant variable: Normal target, Minimum version, cue, or reminder.

### FR-PRG-06 — Simulation approval

A simulated recommendation shall require Apply, Customize, or Keep Current before the next simulated day.

**Acceptance:** No trial, payment, or real habit is created by any simulation action.

## 6.13 Subscription, cancellation, and downgrade

### FR-SUB-01 — Plan selection

Monthly and annual plans shall be presented without a default selection.

**Acceptance:** Start Trial or Continue to Checkout remains disabled until the user explicitly chooses a plan.

### FR-SUB-02 — Trial disclosure

Before checkout confirmation, the website shall show the selected plan, exact post-trial price, first billing date, auto-renewal terms, cancellation path, and applicable refund policy.

**Acceptance:** The user receives in-app notices three days and one day before first billing; email notices are sent when an eligible account has a verified email address and notifications are permitted by policy.

### FR-SUB-03 — Authoritative entitlement

Premium access shall be controlled by backend entitlement derived from signed payment-provider events, not by browser redirects or client-side state alone.

**Acceptance:** A successful-looking return URL cannot enable Premium without authoritative backend confirmation.

### FR-SUB-04 — Pending checkout result

After returning from checkout, the website shall show Processing Payment until entitlement is confirmed or a terminal payment state is received.

**Acceptance:** The user can safely refresh or leave the page without creating duplicate subscriptions.

### FR-SUB-05 — Plan change

A user may request a switch between monthly and annual according to provider and product policy.

**Acceptance:** The product shows the effective date, price, proration behavior if applicable, and confirmation before submission.

### FR-SUB-06 — Cancelled entitlement

Cancelling auto-renewal shall retain Premium until the authoritative entitlement expiry.

**Acceptance:** The UI shows Cancelled — Expires on [date]; immediate downgrade occurs only when entitlement is expired, refunded, or revoked.

### FR-SUB-07 — Downgrade active-limit resolution

When Premium ends, the user shall select up to five active habits; remaining active habits become Paused.

**Acceptance:** No habit or history is deleted.

### FR-SUB-08 — Adaptive-program decision

Expired Premium programs shall enter Decision Required until the user chooses Continue as Static or Pause Program.

**Acceptance:** History remains visible; new adaptive changes are locked until a choice is made.

### FR-SUB-09 — Static continuation

Continue as Static shall retain the last approved structure without Premium adaptation.

**Acceptance:** The program becomes a standard active habit and consumes a Free active slot.

### FR-SUB-10 — Refresh subscription status

The Subscription page shall provide Refresh Status and open the provider-supported management or cancellation surface where applicable.

**Acceptance:** Refresh Status reconciles backend entitlement without creating a second subscription.

### FR-SUB-11 — Webhook idempotency

Repeated, delayed, or out-of-order payment events shall not create duplicate entitlements or regress a newer authoritative state incorrectly.

**Acceptance:** Event processing is idempotent, auditable, and ordered by provider event semantics plus backend safeguards.

## 6.14 Offline resilience and synchronization

### FR-OFF-01 — Cached application shell

After a successful prior load, the website shall provide a usable cached application shell for supported offline routes.

**Acceptance:** The user sees an explicit Offline state rather than a generic browser failure page.

### FR-OFF-02 — Local pending queue

Supported signed-in actions shall be stored locally when connectivity is unavailable.

**Acceptance:** Pending check-ins and approved draft changes survive refresh and browser restart in the same browser profile.

### FR-OFF-03 — Retry behavior

Pending operations shall retry automatically when connectivity returns and may be retried manually.

**Acceptance:** Retries are idempotent and do not create duplicate sessions, check-ins, versions, or recommendations.

### FR-OFF-04 — Unsupported offline actions

Account creation, authentication callback completion, payment, entitlement refresh, cloud export, account deletion, and email delivery require connectivity.

**Acceptance:** The UI blocks only the unavailable action and explains why connectivity is required.

### FR-OFF-05 — Conflict handling

When local and cloud configuration changes conflict, the product shall preserve user history and present a recoverable resolution path.

**Acceptance:** No conflict resolution silently deletes a habit version, check-in, or approved recommendation decision.

## 6.15 Data export, privacy, and account deletion

### FR-DAT-01 — Data export

Authenticated users shall be able to request an export of their account data in a documented machine-readable format.

**Acceptance:** Export includes habits, versions, sessions, check-ins, recommendations, Recovery history, subscription status history, and relevant settings, excluding secrets and internal security data.

### FR-DAT-02 — Legacy local data export

Users with legacy local data shall be able to export locally stored habit data before clearing browser storage.

**Acceptance:** Legacy local data export works before transfer or clearing and does not claim cloud authority.

### FR-DAT-03 — Account deletion

Authenticated users shall be able to initiate account deletion through Account Settings with explicit confirmation and re-authentication where required.

**Acceptance:** The product explains the deletion lifecycle, subscription consequences, retention exceptions, and irreversible effects before confirmation.

### FR-DAT-04 — Clear legacy local data

Users shall be able to clear legacy browser-local product data through Settings.

**Acceptance:** The action requires explicit confirmation and provides an export opportunity before irreversible deletion.

# 7. Habit State Model and Business Rules

## 7.1 Lifecycle state definitions

| **State** | **Meaning** | **Consumes active slot** |
|---|---|---:|
| Draft | Configured but not active | No |
| Starting | Early sessions; insufficient evidence | Yes |
| Building | Active formation with developing consistency | Yes |
| Active | Operating normally | Yes |
| Stable | Meets current stability criteria | Yes |
| At Risk | Signals indicate declining performance | Yes |
| Recovery | Short recovery plan is active | Yes |
| Rebuilding | Post-recovery or redesigned version establishing a new pattern | Yes |
| Needs Review | Two failed recovery plans or unresolved structural issue | Yes |
| Paused | No sessions or reminders generated | No |
| Stopped | User intentionally ended ongoing practice | No |
| Completed | Finite habit/program completed | No |
| Archived | Hidden historical item | No |
| Trash | Soft-deleted and retained for 30 days | No |
| Decision Required | Premium expiry action is pending | No |

## 7.2 Session status definitions

| **Status** | **Consistency** | **Continuity** | **Recovery counter** |
|---|---|---|---|
| Full | Success | Preserves | Resets |
| Minimum | Success | Preserves | Resets |
| Manual Skipped | Failure | Breaks | Increments |
| Automatic Skipped | Failure | Breaks | No increment |
| Excused | Excluded | Does not preserve | No increment |
| Unrecorded | Pending / excluded | Pending | No increment |
| Paused / unscheduled | Excluded | No session | No increment |

## 7.3 State transition rules

- Starting transitions to Building after enough evaluated sessions to establish an initial pattern.

- Building or Active may transition to Stable only when all Stable criteria are met.

- Three consecutive Manual Skipped sessions transition the habit into Recovery.

- Successful Recovery transitions to Rebuilding for the next Normal-target session, then back to Active or Building based on evidence.

- Two consecutive failed Recovery Plans transition to Needs Review.

- User actions may transition any eligible active state to Paused, Stopped, Completed, Archived, or Trash.

- Redesign creates a new version and normally enters Starting or Rebuilding while retaining the parent habit identity.

- Payment expiry may transition Premium adaptive programs to Decision Required without deleting habit history.

## 7.4 Recommendation decision contract

> **System recommendation contract**
>
> Observe one dominant signal → explain why it matters → propose one smallest useful change → require Apply, Customize, or Keep Current → store the decision and effective session.

## 7.5 Active-slot rules

- A habit consumes a slot only while in Starting, Building, Active, Stable, At Risk, Recovery, Rebuilding, or Needs Review.

- Draft does not consume a slot until activation.

- Pausing a habit releases its slot immediately after the transition is confirmed.

- A downgrade does not delete over-limit habits; it moves non-selected active habits to Paused.

- Conflicting browser tabs must not allow active-slot limits to be exceeded permanently.

# 8. Data and System Behavior

## 8.1 Core entities

| **Entity** | **Purpose** | **Key relationships** |
|---|---|---|
| Account Profile | Identity, plan, settings, timezone, quiet hours | Owns habits and entitlements |
| Browser Installation | Local browser identity, capability, push subscription, queue ownership | Belongs to an authenticated account |
| Habit | Stable identity across redesigns | Has versions, sessions, lifecycle state |
| Habit Version | Immutable approved configuration snapshot | Generates future sessions |
| Session | One eligible scheduled occurrence | Has status and timezone snapshot |
| Check-in | Recorded outcome and optional friction | Belongs to one session |
| Recommendation | Observed signal, proposed change, decision | May create a new version |
| Recovery Plan | Short plan with target and result | Belongs to a habit version |
| Review Item | Weekly or contextual attention item | May reference recommendation |
| Reminder Configuration | Channel, schedule, quiet hours, capability state | Belongs to habit and installation/account |
| Pending Operation | Local offline action awaiting synchronization | References one idempotency key |
| Subscription Entitlement | Backend-authoritative Lite or Premium state | Controls feature access |
| Payment Event | Signed provider event and processing result | Updates entitlement audit trail |
| Change History | Version and settings decisions | Supports restore/revert |

## 8.2 Versioning rules

- A Habit is the long-lived identity; Habit Versions are immutable configuration snapshots.

- Changes to reminder-only settings may be stored as settings history without creating a new habit version.

- Material changes to schedule, frequency, Normal target, Minimum target, cue, or recovery structure create a new Habit Version.

- Restore creates a new version based on the selected historical version.

- Check-ins remain attached to the version that generated their sessions.

- Version identifiers are stable across offline retries and cloud synchronization.

## 8.3 Signed-in browser cache and legacy local data

- Signed-in habits, versions, sessions, check-ins, drafts, settings, recommendations, and pending operations use browser-managed IndexedDB as a cache, draft store, and pending-operation store.

- Account-local records are scoped to the authenticated account and browser installation.

- Private/incognito browsing, browser-data clearing, storage eviction, profile deletion, or device loss may remove local cache and draft data, but PostgreSQL remains canonical for signed-in records.

- Browser data from a pre-account legacy version is never presented as cloud-backed Free data. The product provides an explicit transfer or export path before any legacy local data is cleared.

## 8.4 Signed-in synchronization model

- Supabase PostgreSQL is the canonical cloud source for signed-in account data.

- The browser maintains a local cache and pending-operation queue for fast interaction and temporary offline support.

- Check-ins and generated sessions use stable identifiers and idempotency safeguards.

- Configuration conflicts preserve both versions when a destructive overwrite would lose history.

- Server authorization and Row Level Security remain authoritative regardless of browser state.

- Entitlement requires online backend reconciliation; a cached entitlement may be used only under an explicitly defined grace policy.

## 8.5 Legacy local data transfer

- Local habits, versions, sessions, check-ins, reminder settings, recommendations, drafts, and relevant settings from an older browser-local dataset may be transferred to the signed-in account.

- Migration is transactional from the user's perspective: either the account confirms the imported dataset or the legacy local dataset remains intact for retry.

- If account data already exists, the product presents a safe merge path rather than silently replacing either dataset.

- Browser notification permission remains installation-specific after account conversion.

- Local data is not deleted until the backend confirms the transfer and the user receives a successful result.

## 8.6 Multiple tabs and concurrent sessions

- The application must coordinate local queue processing across multiple tabs.

- Only one active worker should submit a given pending operation at a time.

- Confirmed changes should propagate to other active tabs.

- Stale tabs must detect revision conflicts before overwriting newer cloud state.

## 8.7 Data retention and deletion

- Habit Trash retention is 30 days unless the user explicitly permanently deletes earlier.

- Subscription downgrade never deletes data.

- Account deletion follows the documented deletion lifecycle and any legally required retention exceptions.

- Payment-event audit data is retained according to legal, security, and financial requirements.

- Analytics must not store free-text notes, habit names, or free-text friction content.

## 8.8 Time and session generation

- Session generation is deterministic and safe to rerun.

- Every generated session stores its timezone snapshot and scheduled local date.

- Browser clock changes must not silently rewrite historical session dates.

- Server time is authoritative for security-sensitive operations, payment events, and synchronization ordering.

# 9. Non-Functional Requirements

## 9.1 Supported browsers and responsive behavior

The MVP shall support the latest two stable versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Apple Safari

The application shall remain usable at these viewport ranges:

| **Class** | **Width** |
|---|---:|
| Mobile | 360–767 px |
| Tablet | 768–1023 px |
| Laptop | 1024–1439 px |
| Desktop | 1440 px and above |

Unsupported browsers receive a clear compatibility message and access to export, help, and sign-in recovery where feasible.

## 9.2 Performance

- The public landing page should achieve fast first rendering and avoid loading authenticated application code unnecessarily.

- Today should render locally available habit cards without waiting for cloud synchronization.

- A Full or Minimum check-in should provide visible local confirmation within 150 ms under normal browser conditions.

- Primary application navigation should preserve relevant scroll and filter state without full-page reloads.

- Weekly Review should render from cached or server-fetched structured data and refresh unobtrusively.

- Target Core Web Vitals at the 75th percentile: LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1 for production traffic where measurement is available.

## 9.3 Reliability

- Session generation must be deterministic and safe to rerun.

- Reminder scheduling must be idempotent and cancel stale reminders after configuration changes.

- Subscription entitlement must be reconciled with signed backend payment events.

- Version creation, check-in edits, legacy local data transfer, and payment-event handling require transactional safeguards.

- Offline queue processing must survive refresh and browser restart in the same profile.

- Deployment must support rollback to a previously verified production version.

## 9.4 Accessibility

- The product shall target WCAG 2.2 AA.

- All icon-only controls require accessible names, including Add Habit, profile, overflow menus, check-in options, and reminder controls.

- Check-in states must not rely on color alone.

- All core flows must be operable by keyboard.

- Focus order and focus return must remain predictable across dialogs, drawers, menus, and route changes.

- Text zoom up to 200% must not hide core actions or clip essential content.

- Motion must be minimal and respect reduced-motion preferences.

- Charts and progress visuals require accessible summaries or data alternatives.

- Error messages must identify the affected field and provide recovery guidance.

## 9.5 Privacy and security

- Authentication shall use secure server-compatible session handling.

- Private application data shall be protected through Row Level Security and server authorization.

- Service-role credentials, payment secrets, webhook secrets, and email-provider secrets shall never be exposed to browser code.

- Payment webhooks shall verify provider signatures and reject replayed or invalid events.

- Security-sensitive state-changing endpoints shall implement appropriate CSRF, origin, rate-limit, and authorization protections.

- The production website shall use HTTPS, restrictive security headers, and a documented Content Security Policy.

- Account and payment actions shall be recorded in auditable security logs without storing prohibited sensitive content.

- Do not present behavioral analysis as medical or psychological diagnosis.

- Provide clear export and account-deletion paths.

- Free-text notes and friction data are treated as potentially sensitive personal data.

## 9.6 Localization and time

- All user-facing dates, times, week starts, and billing dates use the user's selected locale and timezone.

- Session boundaries use the session timezone snapshot.

- Copy architecture supports localization without embedding user-facing text in business logic.

- The MVP language is English unless a launch-market decision adds another language before implementation.

## 9.7 SEO and indexing

- Public marketing, pricing, help, and legal pages may be indexed.

- Authenticated application routes, account pages, exports, and private shareable identifiers must not be indexed.

- Public metadata must not reveal private user information.

## 9.8 Observability

- Production errors shall be reported to the approved error-monitoring service with sensitive fields redacted.

- Product analytics shall use an approved privacy-safe event schema.

- Payment, authentication, synchronization, and account-deletion failures shall have operational alerts.

- Health checks must distinguish application availability from dependency failures.

# 10. Analytics and Product Success

## 10.1 North-star direction

The product should optimize for sustainable eligible-session success and successful recovery, not raw daily visits or longest streak. The primary behavioral outcome is the proportion of users who continue engaging with a habit after difficulty.

## 10.2 Product metrics

| **Metric** | **Definition** | **Why it matters** |
|---|---|---|
| First habit activation | First sign-in → first active habit | Measures activation efficiency |
| First check-in completion | First active habit → first Full/Minimum/Skipped | Measures comprehension and immediate utility |
| 7-day eligible consistency | Full + Minimum / eligible sessions in first 7 days | Measures early behavior fit |
| Minimum utilization | Share of successes recorded as Minimum | Shows whether flexible execution is used |
| Recovery entry rate | Habits entering Recovery / active habits | Indicates friction prevalence |
| Recovery success rate | Successful Recovery Plans / completed Recovery Plans | Measures core differentiator quality |
| Post-recovery retention | Habit still active 14 days after Recovery | Measures durable return |
| Recommendation acceptance | Apply or Customize / recommendations viewed | Measures relevance and trust |
| Automatic Skipped rate | Automatic Skipped / eligible sessions | Measures check-in friction |
| Legacy data recovery | Legacy local datasets transferred or exported | Measures continuity and backup value |
| Offline queue success rate | Pending operations synchronized successfully | Measures resilience quality |
| Trial-to-paid conversion | Paid starts / trials started | Measures Premium value |

## 10.3 Guardrail metrics

- Web Push permission denial and block rates.

- Reminder disable rate after the first week.

- Email unsubscribe and complaint rates.

- Frequency of recommendations immediately reverted.

- Habit deletion within seven days of creation.

- Account deletion, payment dispute, refund, and revocation rates.

- Share of users blocked by active-habit limits before first value is achieved.

- Offline queue failure, duplicate-prevention, and conflict rates.

- Authentication callback failure and legacy data-transfer failure rates.

## 10.4 Event taxonomy direction

Analytics events should describe user intent and system state without transmitting unnecessary personal content. Recommended event groups:

- public_site
- authentication
- habit_configuration
- session_checkin
- friction
- reminder
- recovery
- recommendation
- weekly_review
- versioning
- subscription
- downgrade
- offline_queue
- synchronization
- data_export
- account_deletion

## 10.5 Prohibited analytics payloads

Analytics events must not include:

- Habit names
- Normal or Minimum free-text descriptions
- Notes
- Free-text friction content
- Email addresses
- Authentication tokens
- Payment details
- Full IP addresses where avoidable under the approved analytics configuration

# 11. Acceptance Criteria by Epic

## 11.1 Epic A — Public website and account habit tracking

- A visitor can access Landing, Pricing, Help, Privacy, Terms, Cookie, and Refund pages without authentication.

- A new user authenticates before entering the application and receives a Free account with up to five active habits.

- Refreshing and reopening the same browser profile restores the signed-in account cache while PostgreSQL remains canonical.

- The product clearly distinguishes local cache from cloud-backed account data.

- Full and Minimum are available as immediate check-in actions.

- Supported signed-in actions remain available from the local cache during temporary connectivity loss after the application has loaded previously.

## 11.2 Epic B — Flexible metrics

- Full and Minimum count as successful consistency outcomes.

- Manual Skipped and Automatic Skipped break continuity.

- Excused is excluded from consistency and does not preserve continuity.

- Unrecorded remains pending for three calendar days.

- Current-version and lifetime metrics remain distinguishable.

## 11.3 Epic C — Recovery

- Three consecutive Manual Skipped sessions activate Recovery.

- Automatic Skipped alone cannot activate Recovery.

- Recovery defaults to three eligible sessions.

- Two of three successful outcomes complete Recovery successfully.

- Two failed Recovery Plans move the habit to Needs Review.

- No Recovery action silently changes or deletes the habit.

## 11.4 Epic D — Review and adaptation

- Weekly Review opens on demand and identifies priority items.

- Recommendations are unselected by default.

- Multiple selected recommendations can be confirmed together.

- Every material change is reversible through a new version.

- Check-in Review evaluates web and email reminder capability rather than assuming native notification support.

## 11.5 Epic E — Authentication, backup, and legacy data recovery

- A user can authenticate with Google or email magic link / OTP before entering the application.

- Authentication returns the user to the initiating context.

- Legacy browser-local data remains intact until an explicit transfer or export succeeds.

- Existing cloud data is never silently replaced by legacy browser-local data.

- Signed-in data is protected through account-scoped authorization and Row Level Security.

- Re-authentication preserves unsynchronized local work where safe.

## 11.6 Epic F — Premium and subscription

- Free and Lite users can preview Premium programs without receiving Premium access.

- A trial cannot start until an account exists and a plan is explicitly selected.

- Browser redirect state alone cannot enable Premium.

- Cancellation retains entitlement until the authoritative expiry.

- Downgrade preserves all history and guides the user to the active limit of the selected lower tier: 10 for Lite or 5 for Free.

- Refresh Status reconciles entitlement without duplicating the subscription.

## 11.7 Epic G — Reminder trust

- Browser permission is requested only after the user explicitly enables Web Push.

- Denied or unsupported Web Push never blocks habit creation or check-in.

- Email reminders are available only to eligible signed-in accounts.

- Full or Minimum cancels remaining reminders where the channel supports cancellation.

- Reminder changes are never silently applied.

- The product does not promise guaranteed Web Push or email delivery.

## 11.8 Epic H — Offline resilience and multiple tabs

- A supported check-in recorded offline survives refresh in the same browser profile.

- Pending operations synchronize when connectivity returns.

- Retry does not create duplicate check-ins, sessions, versions, or subscriptions.

- Multiple tabs do not process the same pending operation concurrently.

- Conflicts preserve history and present a recoverable resolution path.

## 11.9 Epic I — Accessibility and responsive behavior

- Core flows are keyboard-operable.

- Check-in meaning is not conveyed by color alone.

- Dialogs, drawers, and menus manage focus correctly.

- The interface remains usable at 360 px width and at 200% text zoom.

- Desktop sidebar and mobile bottom navigation lead to the same core destinations.

# 12. MVP Delivery Scope and Roadmap

## 12.1 MVP must include

- Public Landing, Pricing, Help, and required legal pages.

- Authenticated account entry and account-backed persistence.

- Basic templates and custom habit wizard.

- Responsive Today, Habits, Review, Insights, Reminders, and Settings navigation.

- Full, Minimum, Manual Skipped, Excused, Unrecorded, and Automatic Skipped behavior.

- Consistency, current continuity, and lifetime history.

- Web Push reminders where supported, email fallback for eligible accounts, follow-up reminder, quiet hours, and contextual permission request.

- Habit lifecycle, pause/stop/archive/trash, and versioned redesign/restore.

- Recovery Mode, Weekly Review, and Check-in Review.

- Google and email authentication.

- Cloud backup, basic cross-device synchronization, safe legacy-local data recovery, and offline pending queue.

- Premium program preview simulation.

- Website subscription checkout, backend entitlement, cancellation, status refresh, and downgrade flow.

- Data export and account deletion.

- Responsive accessibility, error monitoring, privacy-safe analytics, and production deployment.

## 12.2 Recommended delivery phases

| **Phase** | **Scope** | **Exit criterion** |
|---|---|---|
| 1. Web foundation | Next.js shell, environments, design tokens, authentication foundation, Supabase local setup | Verified local, preview, and production configuration boundaries |
| 2. Core tracking | Account storage, wizard, Today, check-ins, metrics | A Free account completes a full weekly loop across supported browsers |
| 3. Lifecycle | Habits, versions, pause/stop/trash, history | No destructive change loses history |
| 4. Recovery and review | Recovery, Weekly Review, Check-in Review | All trigger and exclusion rules pass |
| 5. Account and synchronization | Authentication, legacy-local data recovery, cloud backup, conflict handling, multiple tabs | Signed-in state synchronizes idempotently and legacy data is recoverable |
| 6. Reminders and offline resilience | Web Push, email fallback, quiet hours, service worker, pending queue | Supported actions remain safe through connectivity interruption |
| 7. Premium programs | Catalogue, preview simulation, adaptive programs | Preview and real program remain clearly separated |
| 8. Commerce and release | Checkout, webhooks, entitlement, downgrade, analytics, observability, QA | Authoritative payment state and product access remain consistent |

## 12.3 Deferred after MVP

- Native Android and iOS applications.

- Wearable and health-platform integrations.

- Social groups, accountability partners, or coaching marketplace.

- Automatic activity verification.

- Generative conversational coach.

- Browser extensions.

- Public developer API.

- Advanced experimentation platform beyond core analytics.

- Organization accounts and enterprise administration.

# 13. Risks, Dependencies, and Validation Hypotheses

## 13.1 Product risks

| **Risk** | **Potential impact** | **Mitigation** |
|---|---|---|
| Too many states | Users may not understand lifecycle labels | Expose only relevant labels; keep internal state richer than UI |
| Recovery feels punitive | Users disengage after repeated misses | Use neutral copy, short plans, and explicit user control |
| Minimum becomes permanent avoidance | Habit no longer matches intended goal | Stable — target review suggested and Minimum-share analysis |
| Free tier feels incomplete | Low trust and conversion | Keep core templates, check-ins, Recovery, and Weekly Review useful |
| Premium preview gives too little or too much | Low conversion or product leakage | Test three-day simulation depth and CTA timing |
| Reminder fatigue | Users block notifications or unsubscribe | Contextual permission, one optional follow-up, quiet hours, and reduction trials |
| Browser storage is cleared | Legacy local data loss | Clear disclosure, export, and safe data transfer |
| Web Push is unavailable or unreliable | Missed reminders | In-app state, email fallback, capability messaging, and no guaranteed-delivery claim |
| Offline queue creates duplicates | Metric corruption | Stable IDs, idempotency keys, one queue worker, and backend constraints |
| Multiple tabs create stale writes | Lost or conflicting configuration | Revision checks, cross-tab coordination, and recoverable conflict handling |
| Payment event mismatch | Access or billing complaints | Signed webhooks, backend entitlement, idempotent event processing, visible dates |
| Responsive complexity | Inconsistent workflows across devices | Shared information architecture and component contracts across breakpoints |

## 13.2 External dependencies

- Domain registrar and DNS provider.

- Vercel deployment and hosting services.

- Supabase authentication, PostgreSQL, Row Level Security, storage, and Edge Functions.

- Approved website payment provider and signed webhook delivery.

- Transactional email provider.

- Browser Web Push and service-worker capabilities.

- Error-monitoring and privacy-safe analytics services.

- Google OAuth configuration.

## 13.3 Hypotheses to validate

| **Hypothesis** | **Initial product rule** | **Validation signal** |
|---|---|---|
| Stable threshold is useful | 8 sessions, 80% consistency, no 3 Manual Skips | Stable users sustain performance and accept reminder reduction |
| Three-session recovery is sufficient | Success at 2/3 or 3/3 | Recovery success and 14-day post-recovery retention |
| Three-day Unrecorded window is balanced | Auto-classify after 3 days | Late classification rate vs Automatic Skipped complaints |
| One recommendation improves trust | Change one variable at a time | Acceptance, customization, and revert rates |
| Three-day Premium simulation demonstrates value | Days 1–3 interactive | Preview completion and View Plans conversion |
| Fixed weekly review is easier to build as a routine | Default Sunday | Review completion and rescheduling behavior |
| Sign-up friction reduces activation | Account creation adds first-use friction | Account completion, first habit activation, and first check-in |
| Email fallback improves reminder reliability | Available to signed-in users | Reminder engagement without excessive unsubscribe rate |
| Responsive desktop navigation improves review behavior | Persistent sidebar on larger screens | Review completion and route discoverability |

## 13.4 Approved technical-product decisions

- Product platform: responsive website and installable PWA only.

- Frontend framework: Next.js with React and TypeScript.

- UI system: Tailwind CSS with accessible reusable components.

- Backend: Supabase PostgreSQL, Auth, Row Level Security, and Edge Functions.

- Hosting and deployment: Vercel.

- Account persistence: Supabase PostgreSQL canonical data with IndexedDB cache, drafts, and pending operations.

- Signed-in canonical data: Supabase PostgreSQL with browser cache and pending-operation queue.

- Authentication: Google and email magic link / OTP.

- Reminder channels: in-app, Web Push where available, and email fallback for eligible accounts.

- Payment model: website checkout with backend-authoritative entitlement and signed provider webhooks.

- Execution mode for implementation plans: one agent, sequential tasks, fresh verification before completion.

## 13.5 Remaining product decisions

- Final product name, brand system, and visual identity.

- Final monthly and annual pricing by launch market.

- Final payment provider account and supported launch-market payment methods.

- Transactional email provider.

- Final localization languages beyond English.

- Final legal text and launch-market compliance review.

- Final analytics and cookie-consent configuration.

# 14. Appendix: Terminology and Reference Flows

## 14.1 Terminology

| **Term** | **Definition** |
|---|---|
| Normal version | The intended standard form of the habit for a normal context. |
| Minimum version | The smallest meaningful action that preserves continuity. |
| Fallback | Alternative execution path when the normal context is unavailable. |
| Cue | Context or event associated with starting the habit. |
| Consistency | Successful Full + Minimum outcomes divided by eligible scheduled sessions. |
| Continuity | Current uninterrupted sequence of Full or Minimum eligible sessions. |
| Manual Skipped | A user-classified missed session. |
| Automatic Skipped | An Unrecorded session auto-classified after three days. |
| Excused | A legitimate missed session excluded from consistency and continuity preservation. |
| Recovery Mode | Short guided plan after three consecutive Manual Skipped sessions. |
| Check-in Review | A review triggered by repeated Automatic Skipped sessions. |
| Habit Version | Immutable configuration snapshot created by material changes or restore. |
| Free | An authenticated account with the basic cloud-backed capability set. |
| Lite | An authenticated account with expanded capacity and enhanced recovery capability. |
| Premium | An authenticated account with the full paid capability set. |
| Legacy local dataset | Browser-local records created before the account-only application boundary. |
| Browser Installation | One browser profile and origin storing local state and capability information. |
| Pending Operation | A local action waiting for safe cloud synchronization. |
| Entitlement | Backend-authoritative record of feature access. |
| PWA | Installable progressive web application using web platform capabilities. |

## 14.2 Reference flow — Unrecorded

> **Unrecorded flow**
>
> Scheduled session → no check-in at cutoff → Unrecorded → user may classify for 3 days → if unresolved, Automatic Skipped → consistency decreases, Recovery counter unchanged → 3 Automatic Skipped in 14 days creates Check-in Review.

## 14.3 Reference flow — Recovery

> **Recovery flow**
>
> 3 consecutive Manual Skipped → Recovery recommendation → user approves/customizes/keeps current → 3 scheduled recovery sessions → 2/3 success returns to Normal target → 0–1/3 creates lighter second plan → second failure creates Needs Review.

## 14.4 Reference flow — Legacy local data recovery

> **Legacy data recovery flow**
>
> User authenticates → callback validation → legacy local dataset inventory → optional merge summary → transactional import or export → backend confirmation → legacy local data retained until success → account cache becomes active.

## 14.5 Reference flow — Offline check-in

> **Offline check-in flow**
>
> Connectivity lost → user records Full/Minimum/Skipped → local confirmation → pending operation stored with stable ID → connectivity returns → one active queue worker submits → backend accepts idempotently → local status becomes Synced or Conflict.

## 14.6 Reference flow — Premium expiry

> **Premium expiry flow**
>
> Backend entitlement expires → user selects up to the active limit of the new tier (10 for Lite or 5 for Free) → remaining active habits become Paused → adaptive programs enter Decision Required → user chooses Continue as Static or Pause → no history is deleted.

## 14.7 Reference flow — Website payment

> **Payment flow**
>
> User selects plan → disclosures confirmed → checkout → provider return → Processing Payment → signed backend event verified → entitlement updated idempotently → website refreshes authoritative status → Premium enabled or recovery state shown.

## 14.8 Definition of product-ready PRD

- MVP boundary is accepted by product, design, and engineering.

- State transitions and session calculations are represented in testable specifications.

- UX flows cover desktop, tablet, mobile web, empty, offline, error, locked, payment, authentication, and downgrade states.

- Technical design resolves account identity, local cache, synchronization, multiple tabs, Web Push, email reminders, security, and entitlement architecture.

- Analytics events, cookie handling, privacy review, and legal pages are approved before production release.

- Payment, export, account deletion, and incident-response procedures have owners and test evidence.
