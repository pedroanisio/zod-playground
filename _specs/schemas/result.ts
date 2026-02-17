// Copyright (c) source-code. Licensed under MIT.
//
// ─────────────────────────────────────────────────────────────────────────
// Result Utilities
// ─────────────────────────────────────────────────────────────────────────
//
// Define a lightweight Result<T, E> model and helpers for explicit, typed
// error handling without exception-based control flow.

/** Define the ResultError interface contract. */
export interface ResultError {
  code: string;
  message: string;
  cause?: unknown;
}

/** Represent Result values inferred from the schema layer. */
export type Result<T, E = ResultError> = { success: true; data: T } | { success: false; error: E };

/**
 * Create a successful result value.
 *
 * @param data - Successful payload.
 * @returns A success variant of {@link Result}.
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failure result value.
 *
 * @param error - Error payload.
 * @returns A failure variant of {@link Result}.
 */
export function err<E = ResultError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Create a failure result from standard error parts.
 *
 * @param code - Stable error code.
 * @param message - Human-readable error message.
 * @param cause - Optional underlying error value.
 * @returns A failure result with normalized {@link ResultError}.
 */
export function fail(code: string, message: string, cause?: unknown): Result<never, ResultError> {
  return { success: false, error: { code, message, cause } };
}

/**
 * Unwrap a result and return its success payload.
 *
 * @param result - Result to unwrap.
 * @returns Success payload value.
 * @throws `Error` If `result` is a failure.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(`Unwrap failed: ${JSON.stringify(result.error)}`);
}

/**
 * Unwrap a result or return a default value.
 *
 * @param result - Result to inspect.
 * @param defaultValue - Fallback value when `result` is a failure.
 * @returns Success payload or `defaultValue`.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Map a success payload to a new value.
 *
 * @param result - Input result.
 * @param fn - Mapping function for success values.
 * @returns A mapped success result or the original failure.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.success ? ok(fn(result.data)) : result;
}

/**
 * Check whether a result is successful.
 *
 * @param result - Result to inspect.
 * @returns `true` when the value is a success variant.
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check whether a result is a failure.
 *
 * @param result - Result to inspect.
 * @returns `true` when the value is a failure variant.
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Normalize an unknown error value to a display string.
 *
 * @param error - Unknown error value.
 * @returns Error message string.
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
