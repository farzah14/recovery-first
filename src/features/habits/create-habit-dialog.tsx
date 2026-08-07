'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  Leaf,
  HeartPulse,
  BookOpen,
  Footprints,
  Users,
  Sparkles,
  Droplets,
  Apple,
  Target,
  Flame,
  Coffee,
  Music,
  Zap,
  Dumbbell,
  Moon,
  Code,
  Pencil,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';

export interface CreateHabitFormData {
  name: string;
  category: string;
  description?: string;
  normalTarget: string;
  minimumTarget: string;
  icon: string;
  startDate: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
}

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (data: CreateHabitFormData) => void;
  existingNames?: string[];
}

function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0] ?? '';
}

function getTomorrowDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0] ?? '';
}

function getNextMondayDateStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
  const nextMonday = new Date(d);
  nextMonday.setDate(diff);
  return nextMonday.toISOString().split('T')[0] ?? '';
}

export const CATEGORY_OPTIONS = [
  { id: 'mindfulness', label: 'Mindfulness', Icon: Sparkles },
  { id: 'health', label: 'Health', Icon: Dumbbell },
  { id: 'learning', label: 'Learning', Icon: BookOpen },
  { id: 'creativity', label: 'Creativity', Icon: Pencil },
  { id: 'social', label: 'Social', Icon: Users },
  { id: 'other', label: 'Other', Icon: Target },
];

export const ICON_OPTIONS = [
  { id: 'meditation', label: 'Meditation', Icon: HeartPulse },
  { id: 'water', label: 'Water', Icon: Droplets },
  { id: 'reading', label: 'Reading', Icon: BookOpen },
  { id: 'exercise', label: 'Exercise', Icon: Dumbbell },
  { id: 'running', label: 'Running', Icon: Footprints },
  { id: 'sleep', label: 'Sleep', Icon: Moon },
  { id: 'coding', label: 'Coding', Icon: Code },
  { id: 'writing', label: 'Writing', Icon: Pencil },
  { id: 'nutrition', label: 'Nutrition', Icon: Apple },
  { id: 'target', label: 'Target', Icon: Target },
  { id: 'flame', label: 'Energy', Icon: Flame },
  { id: 'coffee', label: 'Coffee', Icon: Coffee },
  { id: 'music', label: 'Music', Icon: Music },
  { id: 'zap', label: 'Power', Icon: Zap },
];

export const CLOCK_PRESETS = [
  { label: '07:00 AM - 08:00 AM', from: '07:00', until: '08:00' },
  { label: '08:00 AM - 09:00 AM', from: '08:00', until: '09:00' },
  { label: '11:00 AM - 12:00 PM', from: '11:00', until: '12:00' },
  { label: '05:00 PM - 06:00 PM', from: '17:00', until: '18:00' },
];

export function formatTime12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const formattedH = h < 10 ? `0${h}` : `${h}`;
  return `${formattedH}:${m} ${ampm}`;
}

export function formatTimeRange(from24: string, until24: string): string {
  if (!from24 || !until24) return '';
  return `${formatTime12(from24)} - ${formatTime12(until24)}`;
}

export function CreateHabitDialog({
  open,
  onOpenChange,
  onCreated,
  existingNames = [],
}: CreateHabitDialogProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [category, setCategory] = useState('mindfulness');
  const [description, setDescription] = useState('');
  const [normalTarget, setNormalTarget] = useState('');
  const [minimumTarget, setMinimumTarget] = useState('');
  const [icon, setIcon] = useState('meditation');
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [fromTime, setFromTime] = useState('08:00');
  const [untilTime, setUntilTime] = useState('09:00');
  const [timingContext, setTimingContext] = useState('08:00 AM - 09:00 AM');

  const isDuplicateName = (value: string): boolean => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return false;
    return existingNames.some((existing) => existing.trim().toLowerCase() === trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isDuplicateName(name)) {
      setNameError('A habit with this name already exists. Choose a different name.');
      return;
    }
    setNameError('');

    const categoryLabel = CATEGORY_OPTIONS.find((c) => c.id === category)?.label || 'Mindfulness';

    const finalTiming = timingContext.trim() || formatTimeRange(fromTime, untilTime);

    const formData: CreateHabitFormData = {
      name: name.trim(),
      category: categoryLabel,
      description: description.trim(),
      normalTarget: normalTarget.trim() || 'Normal version',
      minimumTarget: minimumTarget.trim() || 'Minimum version',
      icon,
      startDate: startDate || getTodayDateStr(),
      fromTime,
      untilTime,
      timingContext: finalTiming,
    };

    if (onCreated) {
      onCreated(formData);
    }

    // Reset Form
    setName('');
    setNameError('');
    setCategory('mindfulness');
    setDescription('');
    setNormalTarget('');
    setMinimumTarget('');
    setIcon('meditation');
    setStartDate(getTodayDateStr());
    setFromTime('08:00');
    setUntilTime('09:00');
    setTimingContext('08:00 AM - 09:00 AM');

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-white p-0 sm:max-w-xl">
        {/* Header */}
        <div className="space-y-3 border-b border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#004e27]">
            <PlusCircle className="size-4 text-[#004e27]" />
            <span>Define Your Habit</span>
          </div>

          <div>
            <DialogTitle className="text-2xl font-bold text-[#161A17]">
              Create New Habit
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-[#3f4940]">
              Set the foundation for your new routine with both Normal and Minimum targets.
            </DialogDescription>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#e1e3e3]">
            <div className="h-full w-full rounded-full bg-[#004e27] transition-all duration-300" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar max-h-[75vh] space-y-6 overflow-y-auto p-6"
        >
          {/* Habit Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#161A17]" htmlFor="habitName">
              Habit Name
            </label>
            <input
              id="habitName"
              type="text"
              required
              placeholder="e.g., Morning Meditation"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 'habitNameError' : undefined}
              className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3.5 py-2 text-xs text-[#161A17] transition-all placeholder:text-xs placeholder:text-[#bfc9be] focus:border-[#004e27] focus:ring-1 focus:ring-[#004e27]/30 focus:outline-none"
            />
            {nameError ? (
              <p id="habitNameError" role="alert" className="text-[11px] font-medium text-red-600">
                {nameError}
              </p>
            ) : null}
          </div>

          {/* Category Selection Grid */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#161A17]">Category</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORY_OPTIONS.map((cat) => {
                const CatIcon = cat.Icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex h-20 flex-col items-center justify-center rounded-lg border p-3 transition-all ${
                      isSelected
                        ? 'border-[#004e27] bg-[#96f4a8]/30 font-semibold text-[#027235] ring-1 ring-[#004e27]'
                        : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:bg-[#f3f4f4]'
                    }`}
                  >
                    <CatIcon className="mb-1.5 size-5" />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Definition Grid */}
          <div className="grid grid-cols-1 gap-4 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4 sm:grid-cols-2">
            {/* Normal Target */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-xs font-semibold text-[#161A17]"
                htmlFor="habitFull"
              >
                <CheckCircle2 className="size-4 text-[#004e27]" />
                <span>Normal Target</span>
              </label>
              <p className="text-[11px] text-[#3f4940]">What you aim to do on a good day.</p>
              <input
                id="habitFull"
                type="text"
                placeholder="e.g., Meditate for 20 mins"
                value={normalTarget}
                onChange={(e) => setNormalTarget(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] transition-all placeholder:text-[#bfc9be] focus:border-[#004e27] focus:ring-1 focus:ring-[#004e27]/30 focus:outline-none"
              />
            </div>

            {/* Minimum Target (Recovery First) */}
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-xs font-semibold text-[#161A17]"
                htmlFor="habitMin"
              >
                <Leaf className="size-4 text-[#F59E0B]" />
                <span>Minimum Target</span>
              </label>
              <p className="text-[11px] text-[#3f4940]">Your non-zero effort for hard days.</p>
              <div className="flex h-10 items-center rounded-lg border border-amber-300/70 bg-[#FFFBEB] px-3 transition-all focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20">
                <Leaf className="mr-2 size-4 shrink-0 text-[#F59E0B]" />
                <input
                  id="habitMin"
                  type="text"
                  placeholder="e.g., Take 3 deep breaths"
                  value={minimumTarget}
                  onChange={(e) => setMinimumTarget(e.target.value)}
                  className="w-full border-none bg-transparent text-xs text-[#161A17] placeholder:text-amber-700/50 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Choose Icon */}
          <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
            <span className="block text-xs font-semibold text-[#161A17]">Choose Icon</span>
            <div className="grid grid-cols-7 gap-2 rounded-xl border border-[var(--color-border-standard,#DDE5E1)] bg-[#f8f9f9] p-3">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = opt.Icon;
                const isSelected = icon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={`Select ${opt.label} icon`}
                    onClick={() => setIcon(opt.id)}
                    className={`flex size-9 items-center justify-center rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[#004e27] font-bold text-white shadow-xs ring-2 ring-[#004e27]'
                        : 'text-[#3f4940] hover:bg-white hover:text-[#004e27]'
                    }`}
                    title={opt.label}
                  >
                    <IconComp className="size-4.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Date Calendar Section */}
          <div className="space-y-3 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-1.5 text-xs font-semibold text-[#161A17]"
                htmlFor="habitStartDate"
              >
                <Calendar className="size-4 text-[#004e27]" />
                <span>Start Date (Calendar)</span>
              </label>
              <span className="text-[11px] font-medium text-[#3f4940]">
                Choose when habit begins
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="habitStartDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3.5 text-xs font-semibold text-[#161A17] transition-all focus:border-[#004e27] focus:ring-1 focus:ring-[#004e27]/30 focus:outline-none"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStartDate(getTodayDateStr())}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                  startDate === getTodayDateStr()
                    ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                    : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setStartDate(getTomorrowDateStr())}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                  startDate === getTomorrowDateStr()
                    ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                    : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                )}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setStartDate(getNextMondayDateStr())}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                  startDate === getNextMondayDateStr()
                    ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                    : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40',
                )}
              >
                Next Monday
              </button>
            </div>
          </div>

          {/* Clock Schedule */}
          <div className="space-y-3 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-1.5 text-xs font-semibold text-[#161A17]"
                htmlFor="newHabitFromTime"
              >
                <Clock className="size-4 text-[#004e27]" />
                <span>Clock Schedule (From - Until)</span>
              </label>
              <span className="text-[11px] font-medium text-[#3f4940]">Schedule range</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold text-[#3f4940]"
                  htmlFor="newHabitFromTime"
                >
                  From Clock
                </label>
                <input
                  id="newHabitFromTime"
                  type="time"
                  value={fromTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromTime(val);
                    setTimingContext(formatTimeRange(val, untilTime));
                  }}
                  className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold text-[#3f4940]"
                  htmlFor="newHabitUntilTime"
                >
                  Until Clock
                </label>
                <input
                  id="newHabitUntilTime"
                  type="time"
                  value={untilTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUntilTime(val);
                    setTimingContext(formatTimeRange(fromTime, val));
                  }}
                  className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs font-semibold text-[#161A17] focus:border-[#004e27] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {CLOCK_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setFromTime(p.from);
                    setUntilTime(p.until);
                    setTimingContext(p.label);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    fromTime === p.from && untilTime === p.until
                      ? 'border-[#004e27] bg-[#96f4a8]/30 font-bold text-[#027235]'
                      : 'border-[var(--color-border-standard,#DDE5E1)] bg-white text-[#3f4940] hover:border-[#004e27]/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              id="habitTiming"
              type="text"
              placeholder="e.g. 08:00 AM - 09:00 AM"
              value={timingContext}
              onChange={(e) => setTimingContext(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white px-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
            />
          </div>

          {/* Description & Notes */}
          <div className="space-y-2 border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
            <label className="text-xs font-semibold text-[#161A17]" htmlFor="habitDescription">
              Description & Notes <span className="font-normal text-[#3f4940]">(optional)</span>
            </label>
            <textarea
              id="habitDescription"
              rows={2}
              placeholder="e.g. Drink a full glass of water right after waking up..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-standard,#DDE5E1)] bg-white p-3 text-xs text-[#161A17] focus:border-[#004e27] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[var(--color-border-standard,#DDE5E1)] pt-4">
            <Button
              type="button"
              size="compact"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="compact" variant="primary" disabled={!name.trim()}>
              Save Habit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
