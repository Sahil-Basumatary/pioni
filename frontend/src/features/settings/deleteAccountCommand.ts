export function deleteAccountCommand(username: string): string {
  return `sudo delete "${username}"`;
}
