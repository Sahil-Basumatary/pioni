export function interpolate(
  value: string,
  vars?: Record<string, string>,
): string {
  if (!vars) return value;
  let out = value;
  for (const [name, replacement] of Object.entries(vars)) {
    out = out.split(`{${name}}`).join(replacement);
  }
  return out;
}
