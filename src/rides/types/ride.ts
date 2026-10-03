import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CoordinatesDto } from '../../common/dto/coordinates.dto.js';
import { Coordinates } from '../../common/utils/geo.util.js';

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Ride {
  id: string;
  riderId: string;
  driverId: string;
  pickup: Coordinates;
  dropoff: Coordinates;
  distanceKm: number;
  price: number; // DZD
  status: RideStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * What the CLIENT sends. Note there is no driverId:
 * the server picks the driver — never trust the client for that.
 */
export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  riderId: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  pickup: CoordinatesDto;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  dropoff: CoordinatesDto;
}

export class UpdateRideStatusDto {
  @IsEnum(RideStatus)
  status: RideStatus;
}

/** Everything the repository needs to persist a new ride (computed by the service). */
export type NewRide = Omit<Ride, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
