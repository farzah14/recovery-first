# Week-Start Preference Design

## Problem

Onboarding persists `profiles.week_start`, but the authenticated account context does not read it. Weekly range calculations and the Weekly Overview UI therefore always render Monday through Sunday, even when a user selected Sunday.

## Scope

This change covers Finding 10 only. It propagates the existing saved preference into weekly calculations used by Today, Habits, the signed-in repository, and the application shell. It does not change Review, Insights, Reminders, billing, or the database schema.

## Data contract

The supported UI preference remains Monday (`1`) or Sunday (`7`), matching the values already persisted by onboarding. `AccountContext` and `AccountState` expose a normalized `weekStart` value. Missing or invalid profile data falls back to Monday to preserve current behavior and the existing database default.

Both authenticated layouts select `week_start` from `profiles`. The browser repository call receives the normalized preference from account state; it does not independently query the profile.

## Weekly range calculation

`getLocalWeekRange(localDate, weekStart)` accepts the normalized start day and returns the seven calendar dates containing `localDate`. Monday-first ranges run Monday through Sunday. Sunday-first ranges run Sunday through Saturday.

Today and Habits use the same preference when choosing the session horizon and when requesting weekly overview data. The Supabase repository uses it to query the same start and end dates, preventing the UI and database query from using different weeks.

## Weekly Overview presentation

The application shell builds fallback dates from `getLocalWeekRange` and derives short and full weekday labels from each actual date. When repository data is present, it derives labels from each returned `localDate`. This avoids pairing Sunday-first data with hard-coded Monday-first labels.

## Error and fallback behavior

A missing, malformed, or unsupported `week_start` value becomes Monday. Existing accounts and unauthenticated component contexts therefore keep their current behavior. No data is rewritten.

## Verification

Tests cover:

- Monday-first and Sunday-first date ranges;
- account-context mapping and fallback behavior;
- repository query boundaries for a Sunday-first week;
- Weekly Overview ordering and Today labeling for a Sunday-first account;
- existing Monday-first behavior as a regression check.

The final gate runs focused tests, lint, TypeScript, formatting, the complete repository verification command, and browser smoke checks if affected snapshots require them.
