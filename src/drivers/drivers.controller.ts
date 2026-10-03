import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { DriverService } from './drivers.service.js';
import { CreateDriverDto, UpdateDriverLocationDto } from './types/driver.js';

/** Thin controller: HTTP in/out only, all logic lives in DriverService. */
@Controller('drivers')
export class DriversController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  createDriver(@Body() dto: CreateDriverDto) {
    return this.driverService.createDriver(dto);
  }

  @Get()
  getAllDrivers() {
    return this.driverService.getAllDrivers();
  }

  // Static routes MUST be declared before ':id', otherwise
  // GET /drivers/available is matched by ':id' with id = "available".
  @Get('available')
  getAvailableDrivers() {
    return this.driverService.getAvailableDrivers();
  }

  @Get(':id')
  getDriverById(@Param('id', ParseUUIDPipe) id: string) {
    return this.driverService.getDriverById(id);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.driverService.updateLocation(id, dto.location);
  }
}
