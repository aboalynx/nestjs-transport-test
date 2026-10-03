import { RideStatus } from './types/ride.js';

/**
 * The ride state machine as data, not a chain of if/else.
 * Adding a state or transition = editing one line, and the whole flow is readable at a glance.
 *
 *   REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
 *   REQUESTED / ACCEPTED → CANCELLED
 */
export const ALLOWED_TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  [RideStatus.ACCEPTED]: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
  [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [], // terminal
  [RideStatus.CANCELLED]: [], // terminal
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** States after which the driver is free again. */
export function isTerminal(status: RideStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}
