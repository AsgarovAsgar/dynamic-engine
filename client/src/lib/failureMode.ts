/**
 * Demo switch that forces every widget action to fail, so optimistic rollback
 * can be shown on command rather than by waiting for a real outage.
 *
 * The flag rides in the action payload; the server returns 503 when it sees it
 * (after the usual latency, so the optimistic state is visible before it
 * reverts). Module-level rather than React state because it is read inside a
 * dispatch closure, not rendered.
 */
const FORCE_FAIL_FLAG = '__forceFail';

let forceFailure = false;

export function setForceFailure(enabled: boolean): void {
  forceFailure = enabled;
}

export function isForcingFailure(): boolean {
  return forceFailure;
}

/** Adds the flag to a payload when the demo switch is on. */
export function withFailureFlag(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return forceFailure ? { ...payload, [FORCE_FAIL_FLAG]: true } : payload;
}
