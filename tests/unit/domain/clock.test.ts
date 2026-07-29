import { FixedClock, SystemClock } from '@/domain/shared/clock';

describe('Clock', () => {
  it('returns a defensive copy from FixedClock', () => {
    const instant = new Date('2026-07-28T00:00:00.000Z');
    const clock = new FixedClock(instant);

    const first = clock.now();
    first.setUTCFullYear(2030);

    expect(clock.now().toISOString()).toBe('2026-07-28T00:00:00.000Z');
  });

  it('returns the current instant from SystemClock', () => {
    const before = Date.now();
    const current = new SystemClock().now().getTime();
    const after = Date.now();

    expect(current).toBeGreaterThanOrEqual(before);
    expect(current).toBeLessThanOrEqual(after);
  });
});
