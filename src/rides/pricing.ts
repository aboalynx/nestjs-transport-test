// Named constants instead of magic numbers inside the formula.
export const BASE_FARE_DZD = 100;
export const PRICE_PER_KM_DZD = 50;

/** Pure function: easy to unit test and easy to move to a config/pricing service later. */
export function calculatePrice(distanceKm: number): number {
  // Money is rounded to a whole dinar; in a real system store minor units as integers.
  return Math.round(BASE_FARE_DZD + PRICE_PER_KM_DZD * distanceKm);
}
