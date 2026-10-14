export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_BYTES = 72;

export function isValidNewPassword(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    Array.from(value).length >= PASSWORD_MIN_LENGTH &&
    /\S/u.test(value) &&
    Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES
  );
}
