import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DriverRepository } from '../drivers/drivers.repository.js';
import { DriverService } from '../drivers/drivers.service.js';
import { DriverStatus } from '../drivers/types/driver.js';
import { RideRepository } from './rides.repository.js';
import { RideService } from './rides.service.js';
import { RideStatus } from './types/ride.js';

// Algiers, roughly: pickup in the centre, two drivers at different distances.
const PICKUP = { lat: 36.7538, lng: 3.0588 };
const DROPOFF = { lat: 36.7213, lng: 3.0876 };

describe('RideService', () => {
  let rideService: RideService;
  let driverService: DriverService;

  // Real in-memory repositories (no mocks): the logic under test is the
  // interaction between rides and drivers, so mocking it away would test nothing.
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RideService, RideRepository, DriverService, DriverRepository],
    }).compile();

    rideService = module.get(RideService);
    driverService = module.get(DriverService);
  });

  const createRide = () =>
    rideService.createRide({
      riderId: 'rider-1',
      pickup: PICKUP,
      dropoff: DROPOFF,
    });

  describe('createRide', () => {
    it('assigns the nearest available driver and marks them busy', async () => {
      const far = await driverService.createDriver({
        name: 'Far',
        location: { lat: 36.8, lng: 3.2 },
      });
      const near = await driverService.createDriver({
        name: 'Near',
        location: { lat: 36.754, lng: 3.059 },
      });

      const ride = await createRide();

      expect(ride.driverId).toBe(near.id);
      expect(ride.status).toBe(RideStatus.REQUESTED);
      expect((await driverService.getDriverById(near.id)).status).toBe(
        DriverStatus.BUSY,
      );
      expect((await driverService.getDriverById(far.id)).status).toBe(
        DriverStatus.AVAILABLE,
      );
    });

    it('computes distance and price on the server', async () => {
      await driverService.createDriver({ name: 'D', location: PICKUP });

      const ride = await createRide();

      // ~4.4 km between the two points → 100 + 50 * 4.4 ≈ 320 DZD
      expect(ride.distanceKm).toBeGreaterThan(4);
      expect(ride.distanceKm).toBeLessThan(5);
      expect(ride.price).toBe(Math.round(100 + 50 * ride.distanceKm));
    });

    it('never gives the same driver to two simultaneous requests', async () => {
      await driverService.createDriver({ name: 'Only one', location: PICKUP });

      const results = await Promise.allSettled([createRide(), createRide()]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    });

    it('throws 409 when no driver is available', async () => {
      await expect(createRide()).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRideStatus', () => {
    it('follows the happy path and frees the driver on COMPLETED', async () => {
      const driver = await driverService.createDriver({
        name: 'D',
        location: PICKUP,
      });
      const ride = await createRide();

      await rideService.updateRideStatus(ride.id, RideStatus.ACCEPTED);
      await rideService.updateRideStatus(ride.id, RideStatus.IN_PROGRESS);
      const done = await rideService.updateRideStatus(
        ride.id,
        RideStatus.COMPLETED,
      );

      expect(done.status).toBe(RideStatus.COMPLETED);
      expect((await driverService.getDriverById(driver.id)).status).toBe(
        DriverStatus.AVAILABLE,
      );
    });

    it('frees the driver on CANCELLED', async () => {
      const driver = await driverService.createDriver({
        name: 'D',
        location: PICKUP,
      });
      const ride = await createRide();

      await rideService.updateRideStatus(ride.id, RideStatus.CANCELLED);

      expect((await driverService.getDriverById(driver.id)).status).toBe(
        DriverStatus.AVAILABLE,
      );
    });

    it.each([
      [RideStatus.REQUESTED, RideStatus.COMPLETED],
      [RideStatus.REQUESTED, RideStatus.IN_PROGRESS],
    ])('rejects %s -> %s', async (_from, to) => {
      await driverService.createDriver({ name: 'D', location: PICKUP });
      const ride = await createRide();

      await expect(rideService.updateRideStatus(ride.id, to)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects any change after a terminal state', async () => {
      await driverService.createDriver({ name: 'D', location: PICKUP });
      const ride = await createRide();
      await rideService.updateRideStatus(ride.id, RideStatus.CANCELLED);

      await expect(
        rideService.updateRideStatus(ride.id, RideStatus.ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
