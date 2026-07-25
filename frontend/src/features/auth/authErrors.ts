import { isClerkAPIResponseError } from "@clerk/clerk-react/errors";

export function clerkErrorMessage(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage || err.errors[0]?.message || "Something went wrong";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
}
