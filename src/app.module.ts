import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { DriversModule } from './drivers/drivers.module.js';
import { RidesModule } from './rides/rides.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'nestjs-new',
    }),
    DriversModule,
    RidesModule,
  ],
  // AppController (the event-loop experiment with a catch-all GET /:id) is no longer
  // registered: a root ':id' route can swallow requests meant for other controllers.
})
export class AppModule {}
