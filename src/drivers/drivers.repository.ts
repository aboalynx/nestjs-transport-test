import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Coordinates, haversineKm } from '../common/utils/geo.util.js';
import { CreateDriverDto, Driver, DriverStatus } from './types/driver.js';

/**
 * Data access only — no business rules here.
 * Methods return Promises so swapping the Map for TypeORM/Mongoose later
 * does not change the service code.
 */
@Injectable()
export class DriverRepository {
  // Map gives O(1) lookups by id (an array needs a linear .find()).
  private readonly drivers = new Map<string, Driver>();

  async create(dto: CreateDriverDto): Promise<Driver> {
    const driver: Driver = {
      id: randomUUID(),
      name: dto.name,
      status: DriverStatus.AVAILABLE,
      location: { lat: dto.location.lat, lng: dto.location.lng },
      createdAt: new Date(),
    };
    this.drivers.set(driver.id, driver);
    return driver;
  }

  async findById(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async findAll(): Promise<Driver[]> {
    return [...this.drivers.values()];
  }

  async findAvailable(): Promise<Driver[]> {
    return [...this.drivers.values()].filter(
      (driver) => driver.status === DriverStatus.AVAILABLE,
    );
  }

  async update(
    id: string,
    changes: Partial<Pick<Driver, 'status' | 'location'>>,
  ): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;

    Object.assign(driver, changes);
    return driver;
  }

  /**
   * Finds the nearest AVAILABLE driver and marks them BUSY in one step.
   *
   * Why one step: if "find" and "mark busy" were two awaited calls, two ride
   * requests could interleave between them and both get the same driver.
   * This body has no `await`, so Node runs it to completion without interruption.
   *
   * Postgres equivalent: a transaction with
   *   SELECT ... WHERE status = 'AVAILABLE' ORDER BY distance LIMIT 1 FOR UPDATE SKIP LOCKED
   * followed by UPDATE drivers SET status = 'BUSY'.
   *
   * O(n) over available drivers. At scale: Redis GEO (GEOSEARCH) or PostGIS index.
   */
  async claimNearestAvailable(point: Coordinates): Promise<Driver | undefined> {
    let nearest: Driver | undefined;
    let nearestDistance = Infinity;

    for (const driver of this.drivers.values()) {
      if (driver.status !== DriverStatus.AVAILABLE) continue;

      const distance = haversineKm(point, driver.location);
      if (distance < nearestDistance) {
        nearest = driver;
        nearestDistance = distance;
      }
    }

    if (nearest) nearest.status = DriverStatus.BUSY;
    return nearest;
  }
}
