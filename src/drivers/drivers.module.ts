import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller.js';
import { DriverRepository } from './drivers.repository.js';
import { DriverService } from './drivers.service.js';

@Module({
  controllers: [DriversController],
  providers: [DriverService, DriverRepository],
  // Export the service (not the repository) so other modules go through
  // the business rules instead of touching driver data directly.
  exports: [DriverService],
})
export class DriversModule {}
