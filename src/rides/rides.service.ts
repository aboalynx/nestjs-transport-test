import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { haversineKm } from '../common/utils/geo.util.js';
import { DriverService } from '../drivers/drivers.service.js';
import { calculatePrice } from './pricing.js';
import { canTransition, isTerminal } from './ride-status.js';
import { RideRepository } from './rides.repository.js';
import { CreateRideDto, Ride, RideStatus } from './types/ride.js';

@Injectable()
export class RideService {
  constructor(
    private readonly rideRepository: RideRepository,
    // Depends on DriverService (exported by DriversModule), not on DriverRepository.
    private readonly driverService: DriverService,
  ) {}

  /**
   * 1. Reserve the nearest available driver (atomic — see DriverRepository.claimNearestAvailable)
   * 2. Compute distance + price on the server
   * 3. Persist the ride as REQUESTED
   */
  async createRide(dto: CreateRideDto): Promise<Ride> {
    const driver = await this.driverService.assignNearestDriver(dto.pickup);

    const distanceKm = haversineKm(dto.pickup, dto.dropoff);

    try {
      return await this.rideRepository.create({
        riderId: dto.riderId,
        driverId: driver.id,
        pickup: { lat: dto.pickup.lat, lng: dto.pickup.lng },
        dropoff: { lat: dto.dropoff.lat, lng: dto.dropoff.lng },
        distanceKm: Math.round(distanceKm * 100) / 100,
        price: calculatePrice(distanceKm),
      });
    } catch (error) {
      // Compensate: if saving the ride fails, don't leave the driver stuck as BUSY.
      // With a real DB both writes would go in one transaction instead.
      await this.driverService.releaseDriver(driver.id);
      throw error;
    }
  }

  getAllRides(): Promise<Ride[]> {
    return this.rideRepository.findAll();
  }

  async getRideById(id: string): Promise<Ride> {
    const ride = await this.rideRepository.findById(id);
    if (!ride) throw new NotFoundException(`Ride ${id} not found`);
    return ride;
  }

  async updateRideStatus(id: string, status: RideStatus): Promise<Ride> {
    const ride = await this.getRideById(id); // 404 if missing

    if (!canTransition(ride.status, status)) {
      throw new BadRequestException(
        `Invalid transition: ${ride.status} -> ${status}`,
      );
    }

    const updated = await this.rideRepository.updateStatus(id, status);

    // Ride is over → the driver can accept new rides.
    if (isTerminal(status)) {
      await this.driverService.releaseDriver(ride.driverId);
    }

    return updated!;
  }
}
