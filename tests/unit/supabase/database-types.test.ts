import { describe, expectTypeOf, it } from 'vitest';

import type { Database } from '@/lib/supabase/database.types';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ActivateHabitArgs = Database['public']['Functions']['activate_habit']['Args'];
type TodaySessionRow = Database['public']['Views']['today_session_view']['Row'];

describe('generated database types', () => {
  it('exposes the locked schema contracts', () => {
    expectTypeOf<HabitRow['id']>().toEqualTypeOf<string>();
    expectTypeOf<HabitRow['revision']>().toEqualTypeOf<number>();
    expectTypeOf<HabitInsert['title']>().toEqualTypeOf<string>();
    expectTypeOf<SessionRow['timezone_snapshot']>().toEqualTypeOf<string>();
    expectTypeOf<ActivateHabitArgs['p_command_id']>().toEqualTypeOf<string>();
    expectTypeOf<TodaySessionRow['session_id']>().toEqualTypeOf<string | null>();
  });
});
