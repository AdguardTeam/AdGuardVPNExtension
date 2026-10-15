/**
 * Returns the number of calls recorded by a Vitest mock.
 *
 * @param mock Mock with a call history.
 * @returns Number of recorded calls.
 */
export const getMockCallCount = (mock: { mock: { calls: readonly unknown[][] } }): number => mock.mock.calls.length;
