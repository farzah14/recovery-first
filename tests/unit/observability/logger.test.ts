import { createConsoleLogger } from '@/lib/observability/logger';

describe('structured logger', () => {
  it('redacts sensitive values before writing an event', () => {
    const write = vi.fn();
    const logger = createConsoleLogger({ write });

    logger.info('session_started', {
      requestId: 'req-1',
      accessToken: 'secret-token',
      email: 'person@example.com',
      safeCount: 3,
    });

    expect(write).toHaveBeenCalledWith({
      level: 'info',
      event: 'session_started',
      context: {
        requestId: 'req-1',
        accessToken: '[REDACTED]',
        email: '[REDACTED]',
        safeCount: 3,
      },
    });
  });
});
