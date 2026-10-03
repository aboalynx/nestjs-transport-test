import { IsLatitude, IsLongitude } from 'class-validator';
import { Coordinates } from '../utils/geo.util.js';

/** Reusable request body shape for any { lat, lng } field. */
export class CoordinatesDto implements Coordinates {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}
