import { habitFormDraftSchema } from '@/features/habits/forms/habit-form-schema';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export type HabitWizardDraft = {
  step: 1 | 2 | 3 | 4 | 5;
  values: unknown;
};

export async function saveHabitDraft(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  draftId: string;
  draft: HabitWizardDraft;
  now: string;
}) {
  const values = habitFormDraftSchema.parse(input.draft.values);
  await input.repository.saveHabitDraft(
    input.owner,
    input.draftId,
    { step: input.draft.step, values },
    input.now,
  );
}

export async function loadHabitDraft(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  draftId: string;
}): Promise<HabitWizardDraft | null> {
  const payload = await input.repository.getHabitDraft(input.owner, input.draftId);
  if (!payload || typeof payload !== 'object') return null;
  const draft = payload as HabitWizardDraft;
  return draft.step >= 1 && draft.step <= 5 ? draft : null;
}
