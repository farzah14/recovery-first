import { AppError } from '@/domain/shared/app-error';
import { failure, isFailure, isSuccess, success } from '@/domain/shared/result';

describe('Result', () => {
  it('represents a successful value', () => {
    const result = success({ value: 42 });

    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
    expect(result).toEqual({ ok: true, value: { value: 42 } });
  });

  it('represents an application failure', () => {
    const error = new AppError('validation_failed', 'Input is invalid.', {
      field: 'name',
    });
    const result = failure(error);

    expect(isFailure(result)).toBe(true);
    expect(result).toEqual({ ok: false, error });
  });
});
