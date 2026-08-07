export const habitQueryKeys = {
  all: ['habits'] as const,
  lists: () => [...habitQueryKeys.all, 'list'] as const,
  list: (ownerId: string) => [...habitQueryKeys.lists(), ownerId] as const,
  details: () => [...habitQueryKeys.all, 'detail'] as const,
  detail: (ownerId: string, habitId: string) =>
    [...habitQueryKeys.details(), ownerId, habitId] as const,
};
