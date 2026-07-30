/** Simulated latency helper, shared by the streaming and action routes. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
