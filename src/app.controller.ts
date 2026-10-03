import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':id')
  getHello(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: (error: string) => {
          throw new HttpException(
            'The params is id must be a number',
            HttpStatus.BAD_REQUEST,
          );
        },
      }),
    )
    id: number,
  ): string {
    return this.appService.getHello(id);
  }
}
