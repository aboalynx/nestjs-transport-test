import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coordinates } from '../common/utils/geo.util.js';
import { DriverRepository } from './drivers.repository.js';
import { CreateDriverDto, Driver, DriverStatus } from './types/driver.js';

@Injectable()
export class DriverService {
  constructor(private readonly driverRepository: DriverRepository) {}

  createDriver(dto: CreateDriverDto): Promise<Driver> {
    return this.driverRepository.create(dto);
  }

  getAllDrivers(): Promise<Driver[]> {
    return this.driverRepository.findAll();
  }

  getAvailableDrivers(): Promise<Driver[]> {
    return this.driverRepository.findAvailable();
  }

  /** Throws 404 instead of returning undefined (which Nest would send as an empty 200). */
  async getDriverById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) throw new NotFoundException(`Driver ${id} not found`);
    return driver;
  }

  async updateLocation(id: string, location: Coordinates): Promise<Driver> {
    await this.getDriverById(id); // 404 if missing
    const updated = await this.driverRepository.update(id, {
      location: { lat: location.lat, lng: location.lng },
    });
    return updated!;
  }

  /** Used by RidesService: reserves the closest free driver or fails with 409. */
  async assignNearestDriver(pickup: Coordinates): Promise<Driver> {
    const driver = await this.driverRepository.claimNearestAvailable(pickup);
    // 409 Conflict: the request is valid, but the current state (no free drivers) prevents it.
    if (!driver) throw new ConflictException('No available drivers right now');
    return driver;
  }

  /** Called when a ride ends (COMPLETED / CANCELLED) so the driver can take new rides. */
  async releaseDriver(id: string): Promise<void> {
    await this.getDriverById(id);
    await this.driverRepository.update(id, { status: DriverStatus.AVAILABLE });
  }
}
