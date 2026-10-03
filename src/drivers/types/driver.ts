import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CoordinatesDto } from '../../common/dto/coordinates.dto.js';
import { Coordinates } from '../../common/utils/geo.util.js';

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
}

/** Domain model. With a real DB this would become a TypeORM entity / Mongoose schema. */
export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  location: Coordinates;
  createdAt: Date;
}

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // @ValidateNested + @Type are both needed: @Type turns the plain JSON object
  // into a CoordinatesDto instance so its own decorators actually run.
  @ValidateNested()
  @Type(() => CoordinatesDto)
  location: CoordinatesDto;
}

export class UpdateDriverLocationDto {
  @ValidateNested()
  @Type(() => CoordinatesDto)
  location: CoordinatesDto;
}
