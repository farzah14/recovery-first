export type Success<T> = Readonly<{
  ok: true;
  value: T;
}>;

export type Failure<E> = Readonly<{
  ok: false;
  error: E;
}>;

export type Result<T, E> = Success<T> | Failure<E>;

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}
