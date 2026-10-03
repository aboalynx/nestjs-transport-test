import { canTransition, isTerminal } from './ride-status.js';
import { RideStatus } from './types/ride.js';

const { REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED } = RideStatus;

describe('ride state machine', () => {
  it.each([
    [REQUESTED, ACCEPTED],
    [REQUESTED, CANCELLED],
    [ACCEPTED, IN_PROGRESS],
    [ACCEPTED, CANCELLED],
    [IN_PROGRESS, COMPLETED],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [REQUESTED, COMPLETED],
    [IN_PROGRESS, CANCELLED],
    [COMPLETED, REQUESTED],
    [CANCELLED, ACCEPTED],
    [ACCEPTED, ACCEPTED],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('treats only COMPLETED and CANCELLED as terminal', () => {
    expect(isTerminal(COMPLETED)).toBe(true);
    expect(isTerminal(CANCELLED)).toBe(true);
    expect(isTerminal(IN_PROGRESS)).toBe(false);
  });
});
