import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RideService } from './rides.service.js';
import { CreateRideDto, UpdateRideStatusDto } from './types/ride.js';

@Controller('rides')
export class RidesController {
  constructor(private readonly rideService: RideService) {}

  @Post()
  createRide(@Body() dto: CreateRideDto) {
    return this.rideService.createRide(dto);
  }

  @Get()
  getAllRides() {
    return this.rideService.getAllRides();
  }

  @Get(':id')
  getRideById(@Param('id', ParseUUIDPipe) id: string) {
    return this.rideService.getRideById(id);
  }

  @Patch(':id/status')
  updateRideStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.rideService.updateRideStatus(id, dto.status);
  }
}
