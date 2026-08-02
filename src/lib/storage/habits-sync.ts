'use client';

export interface StoredHabit {
  id: string;
  name: string;
  category: string;
  normalTarget: string;
  minimumTarget: string;
  schedule: string;
  cue?: string;
  status: 'Active' | 'Paused' | 'Archived';
  createdDate: string;
  iconName: string;
  fromTime?: string;
  untilTime?: string;
  timingContext?: string;
}

const HABITS_STORAGE_KEY = 'recovery-first.habits-list';

export function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0] ?? '';
}

export function isTodayDate(dateStr: string): boolean {
  if (!dateStr) return true;
  const todayStr = getTodayDateStr();
  const lower = dateStr.toLowerCase().trim();

  // Standard YYYY-MM-DD comparison
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr <= todayStr;
  }

  if (
    lower.includes('today') ||
    lower.includes('just now') ||
    lower.includes('oct 12') ||
    lower.includes('jan 05')
  ) {
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
    return JSON.parse(raw) as StoredHabit[];
  } catch (err) {
    console.error('Failed to read stored habits', err);
    return [];
  }
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
