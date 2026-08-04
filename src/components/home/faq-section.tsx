'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is a Minimum Target and how does it help?',
    answer:
      'A Minimum Target is a scaled-down version of your habit (e.g., 2 minutes of reading instead of 30 minutes) designed for days when time or energy is low. It keeps the cognitive neural pathway active without causing burnout or streak guilt.',
  },
  {
    question: 'How does the Recovery-First model differ from traditional streak tracking?',
    answer:
      'Traditional trackers treat missed days as absolute failure, resetting your streak to zero and causing shame. Recovery-First treats missed sessions as neutral data points, offering guided friction analysis and step-by-step on-ramps to resume your momentum without punishment.',
  },
  {
    question: 'Do I need to create an account to start using the app?',
    answer:
      'Your account keeps habits, check-ins, and recovery history in your secure cloud workspace. Existing browser-local data can be reviewed and transferred explicitly after sign-in.',
  },
  {
    question: 'Is my habit data private?',
    answer:
      'Yes. Your account data is protected by authenticated access and database ownership policies. You retain control and can export your dataset through the approved account workflow.',
  },
  {
    question: 'Can I upgrade to Premium later to sync across multiple devices?',
    answer:
      'Absolutely. Lite adds cloud sync, enhanced recovery, and weekly capacity analysis; Premium adds advanced friction analysis, analytics/export, and email reminders.',
  },
];

export function FaqSection(): React.JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mx-auto max-w-3xl divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="transition-colors">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-4 rounded-lg p-5 text-left font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:outline-none"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold sm:text-lg">{item.question}</span>
              <ChevronDown
                className={`size-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pt-1 pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
