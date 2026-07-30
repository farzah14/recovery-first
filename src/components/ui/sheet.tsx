'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: 'right' | 'bottom' }): React.JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-overlay)]',
          side === 'right' && 'inset-y-0 right-0 w-[min(92vw,24rem)]',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[var(--radius-lg)]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close aria-label="Close drawer" className="absolute top-3 right-3 grid size-10 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-subtle)]">
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
