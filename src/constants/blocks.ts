/**
 * The number of blocks in a given time period
 */

export const TIME_TO_BLOCKS = {
  // 30 days
  month: 1_296_000n,
  // 14 days
  fortnight: 604_800n,
  // 7 days
  week: 302_400n,
  // 1 day
  days: 43_200n,
  // 1 hour (season)
  hour: 1_800n,
  // 1 minute
  minute: 30n,
  // seconds per block
  seconds: 2n,
} as const;
