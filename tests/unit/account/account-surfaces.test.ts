import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { readAccountSurfaces, type AccountSurfacesRead } from '@/server/account/account-surfaces';

type QueryCall = {
  table: string;
  method: string;
  column?: string;
  value?: unknown;
};

type Fixture = Record<string, ReadonlyArray<Record<string, unknown>>>;

function clientWithRows(fixture: Fixture = {}) {
  const calls: QueryCall[] = [];
  const client = {
    from(table: string) {
      const rows = fixture[table] ?? [];
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      const builder: Record<string, unknown> = {};
      builder.select = () => {
        calls.push({ table, method: 'select' });
        return builder;
      };
      builder.eq = (column: string, value: unknown) => {
        calls.push({ table, method: 'eq', column, value });
        filters.push((row) => row[column] === value);
        return builder;
      };
      builder.in = (column: string, values: unknown[]) => {
        calls.push({ table, method: 'in', column, value: values });
        filters.push((row) => values.includes(row[column]));
        return builder;
      };
      builder.is = (column: string, value: unknown) => {
        calls.push({ table, method: 'is', column, value });
        filters.push((row) => (value === null ? row[column] == null : row[column] === value));
        return builder;
      };
      builder.gte = (column: string, value: unknown) => {
        calls.push({ table, method: 'gte', column, value });
        filters.push((row) => String(row[column]) >= String(value));
        return builder;
      };
      builder.lte = (column: string, value: unknown) => {
        calls.push({ table, method: 'lte', column, value });
        filters.push((row) => String(row[column]) <= String(value));
        return builder;
      };
      builder.order = (column: string) => {
        calls.push({ table, method: 'order', column });
        return builder;
      };
      builder.limit = (value: number) => {
        calls.push({ table, method: 'limit', value });
        return builder;
      };
      builder.maybeSingle = () =>
        Promise.resolve({
          data: rows.filter((row) => filters.every((filter) => filter(row)))[0] ?? null,
          error: null,
        });
      builder.then = (
        resolve: (value: { data: ReadonlyArray<Record<string, unknown>>; error: null }) => unknown,
      ) =>
        Promise.resolve({
          data: rows.filter((row) => filters.every((filter) => filter(row))),
          error: null,
        }).then(resolve);
      return builder;
    },
  } as unknown as Parameters<typeof readAccountSurfaces>[0]['client'];

  return { client, calls };
}

function clientWithError(tableWithError: string) {
  const { client, calls } = clientWithRows();
  const originalFrom = client.from.bind(client);
  client.from = ((table: string) => {
    if (table !== tableWithError) return originalFrom(table);
    calls.push({ table, method: 'from' });
    return {
      select: () => ({
        eq: () => ({
          gte: () => ({
            lte: () =>
              Promise.resolve({ data: null, error: { code: 'XX000', message: 'query failed' } }),
          }),
        }),
      }),
    };
  }) as typeof client.from;
  return client;
}

const readAt = new Date('2026-09-05T04:00:00.000Z');

describe('account surfaces reader', () => {
  it('returns account-scoped Review, Insights, and Reminder data', async () => {
    const { client, calls } = clientWithRows({
      sessions: [
        {
          user_id: 'user-1',
          status: 'full',
          scheduled_local_date: '2026-09-03',
          habit_id: 'habit-1',
        },
        {
          user_id: 'user-1',
          status: 'minimum',
          scheduled_local_date: '2026-09-04',
          habit_id: 'habit-1',
        },
      ],
      weekly_review_summary_view: [
        { user_id: 'user-1', pending_items: 2, window_end: '2026-09-06' },
      ],
      recommendations: [
        {
          user_id: 'user-1',
          explanation_key: 'recommendation.shift_time',
          evidence: { summary: 'Evening sessions are often skipped.' },
          status: 'pending',
          created_at: '2026-09-04T00:00:00.000Z',
        },
      ],
      reminder_configs: [
        {
          user_id: 'user-1',
          habit_id: 'habit-1',
          channel: 'web_push',
          local_time: '08:00:00',
          timezone: 'Asia/Jakarta',
          enabled: true,
        },
      ],
      habits: [{ user_id: 'user-1', id: 'habit-1', title: 'Morning Grounding', deleted_at: null }],
      email_preferences: [{ user_id: 'user-1', reminder_opt_in: false }],
      push_subscriptions: [
        { user_id: 'user-1', id: 'push-1', capability_status: 'granted', revoked_at: null },
      ],
    });

    const result = await readAccountSurfaces({
      client,
      userId: 'user-1',
      timezone: 'Asia/Jakarta',
      now: readAt,
    });

    expect(result).toMatchObject({
      status: 'ready',
      review: {
        startDate: '2026-08-31',
        endDate: '2026-09-06',
        pendingItems: 2,
        resolvedSessions: 2,
        successfulSessions: 2,
        minimumSessions: 1,
      },
      insights: {
        fullTargetRate: 50,
        nonZeroRate: 100,
        recommendation: 'Evening sessions are often skipped.',
      },
      reminders: {
        emailOptIn: false,
        configs: [
          expect.objectContaining({
            habitId: 'habit-1',
            habitTitle: 'Morning Grounding',
            registration: 'registered',
          }),
        ],
      },
    } satisfies Partial<AccountSurfacesRead>);

    expect(
      calls.filter(({ table, method, column, value }) =>
        table === 'sessions'
          ? method === 'eq' && column === 'user_id' && value === 'user-1'
          : table === 'recommendations' ||
              table === 'reminder_configs' ||
              table === 'habits' ||
              table === 'email_preferences' ||
              table === 'push_subscriptions' ||
              table === 'weekly_review_summary_view'
            ? method === 'eq' && column === 'user_id' && value === 'user-1'
            : false,
      ),
    ).toHaveLength(7);
    expect(calls).toContainEqual({
      table: 'sessions',
      method: 'gte',
      column: 'scheduled_local_date',
      value: '2026-08-31',
    });
    expect(calls).toContainEqual({
      table: 'sessions',
      method: 'lte',
      column: 'scheduled_local_date',
      value: '2026-09-06',
    });
  });

  it('returns an empty ready result when the account has no records', async () => {
    const { client } = clientWithRows();

    await expect(
      readAccountSurfaces({ client, userId: 'user-1', timezone: 'UTC', now: readAt }),
    ).resolves.toMatchObject({
      status: 'ready',
      review: { resolvedSessions: 0, pendingItems: 0 },
      insights: { fullTargetRate: null, nonZeroRate: null, recommendation: null },
      reminders: { configs: [], emailOptIn: false },
    });
  });

  it('returns unavailable instead of mixing partial data after a query error', async () => {
    await expect(
      readAccountSurfaces({
        client: clientWithError('sessions'),
        userId: 'user-1',
        timezone: 'UTC',
        now: readAt,
      }),
    ).resolves.toMatchObject({ status: 'unavailable' });
  });
});
