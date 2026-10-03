import { Module } from '@nestjs/common';
import { DriversModule } from '../drivers/drivers.module.js';
import { RidesController } from './rides.controller.js';
import { RideRepository } from './rides.repository.js';
import { RideService } from './rides.service.js';

@Module({
  // Importing DriversModule makes its exported DriverService injectable here.
  imports: [DriversModule],
  controllers: [RidesController],
  providers: [RideService, RideRepository],
})
export class RidesModule {}
