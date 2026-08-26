export function isClerkAPIResponseError(
  _err: unknown,
): _err is { errors: { message?: string; longMessage?: string }[] } {
  return false;
}
