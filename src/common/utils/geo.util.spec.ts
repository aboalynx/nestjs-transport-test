import { haversineKm } from './geo.util.js';

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(
      haversineKm({ lat: 36.75, lng: 3.06 }, { lat: 36.75, lng: 3.06 }),
    ).toBe(0);
  });

  it('matches a known distance (Algiers -> Oran ≈ 354 km)', () => {
    const algiers = { lat: 36.7538, lng: 3.0588 };
    const oran = { lat: 35.6971, lng: -0.6308 };

    expect(haversineKm(algiers, oran)).toBeCloseTo(354, -1); // within ~5 km
  });
});
