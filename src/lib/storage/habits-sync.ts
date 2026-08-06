'use client';

import { normalizeCreatedDate } from '@/domain/habits/habit-filters';
import { DEFAULT_HABITS, type HabitRecord } from '@/domain/habits/default-habits';

export type StoredHabit = HabitRecord;

const HABITS_STORAGE_KEY = 'recovery-first.habits-list';

export function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0] ?? '';
}

export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return true;
  const todayStr = getTodayDateStr();
  const lower = dateStr.toLowerCase().trim();

  const normalized = normalizeCreatedDate(dateStr);
  if (normalized) return normalized <= todayStr;

  if (lower.includes('today') || lower.includes('just now')) {
    return true;
  }

  if (lower.includes('tomorrow') || lower.includes('next monday')) {
    return false;
  }

  return false;
}

export function getStoredHabits(): StoredHabit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredHabit[]) : [];
  } catch (err) {
    console.error('Failed to read stored habits', err);
    return [];
  }
}

/**
 * Returns the canonical Library records: defaults plus browser-local overrides/new habits.
 * Records are merged by stable ID so editing a default habit never creates a second habit.
 */
export function getLibraryHabits(): StoredHabit[] {
  const stored = getStoredHabits();
  const storedById = new Map(stored.map((habit) => [habit.id, habit]));
  const defaultIds = new Set(DEFAULT_HABITS.map((habit) => habit.id));

  return [
    ...DEFAULT_HABITS.map((habit) => {
      const stored = storedById.get(habit.id);
      return stored ? { ...habit, ...stored } : { ...habit };
    }),
    ...stored.filter((habit) => !defaultIds.has(habit.id)),
  ];
}

export function getLibraryHabitCountForDate(date: Date): number {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${date.getFullYear()}-${month}-${day}`;

  return getLibraryHabits().filter((habit) => {
    if (habit.status === 'Archived') return false;
    return normalizeCreatedDate(habit.createdDate) === dateKey;
  }).length;
}

export function saveStoredHabits(habits: StoredHabit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    window.dispatchEvent(new Event('habits-updated'));
  } catch (err) {
    console.error('Failed to save stored habits', err);
  }
}

export function addHabitToSync(habit: StoredHabit): void {
  const existing = getStoredHabits();
  const updated = [habit, ...existing.filter((h) => h.id !== habit.id)];
  saveStoredHabits(updated);
}

export function updateHabitToSync(id: string, updates: Partial<StoredHabit>): void {
  const current = getLibraryHabits().find((habit) => habit.id === id);
  if (!current) return;

  const updated = { ...current, ...updates };
  const existing = getStoredHabits();
  saveStoredHabits([updated, ...existing.filter((habit) => habit.id !== id)]);
}

export function archiveHabitToSync(id: string): void {
  updateHabitToSync(id, { status: 'Archived' });
}
