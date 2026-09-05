# Task 11 Privacy Storage Description

## Problem

The authenticated settings page says that all habit details are stored locally with Recovery First encryption. Signed-in habit records are written to Supabase, browser-local fallback and legacy records remain browser data, and the application does not provide encryption for either local path.

## Decision

Replace the settings copy with a concise statement that:

- signed-in accounts sync habit details to Supabase;
- browser-local records remain on the current device; and
- browser-local records are not encrypted by the application.

Keep the existing settings layout and privacy section. The wording change is the complete Task 11 scope.

## Out of scope

- Adding client-side encryption.
- Changing Supabase or browser storage behavior.
- Adding export, deletion, or migration workflows.
- Changing public privacy or marketing copy that is not identified by the finding.
