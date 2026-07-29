import 'server-only';

export function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('This module can only execute on the server.');
  }
}
