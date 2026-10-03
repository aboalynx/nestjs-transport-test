import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NewRide, Ride, RideStatus } from './types/ride.js';

/** Data access only. The state machine is enforced in RideService, not here. */
@Injectable()
export class RideRepository {
  private readonly rides = new Map<string, Ride>();

  async create(data: NewRide): Promise<Ride> {
    const now = new Date();
    const ride: Ride = {
      id: randomUUID(),
      ...data,
      status: RideStatus.REQUESTED,
      createdAt: now,
      updatedAt: now,
    };
    this.rides.set(ride.id, ride);
    return ride;
  }

  async findById(id: string): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async findAll(): Promise<Ride[]> {
    return [...this.rides.values()];
  }

  async updateStatus(
    id: string,
    status: RideStatus,
  ): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;

    ride.status = status;
    ride.updatedAt = new Date();
    return ride;
  }
}
