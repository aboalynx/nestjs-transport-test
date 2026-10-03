import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DriversModule } from './../src/drivers/drivers.module.js';
import { RidesModule } from './../src/rides/rides.module.js';

/** Full HTTP flow: validation, status codes and the ride lifecycle. */
describe('Rides API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Import the feature modules directly so the test doesn't need ObserveModule credentials.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DriversModule, RidesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Same pipe as main.ts — otherwise DTO validation wouldn't run in tests.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it('runs a ride from request to completion', async () => {
    const driver = await request(server())
      .post('/drivers')
      .send({ name: 'Karim', location: { lat: 36.754, lng: 3.059 } })
      .expect(201);

    const ride = await request(server())
      .post('/rides')
      .send({
        riderId: 'rider-1',
        pickup: { lat: 36.7538, lng: 3.0588 },
        dropoff: { lat: 36.7213, lng: 3.0876 },
      })
      .expect(201);

    expect(ride.body.driverId).toBe(driver.body.id);
    expect(ride.body.status).toBe('REQUESTED');

    for (const status of ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']) {
      await request(server())
        .patch(`/rides/${ride.body.id}/status`)
        .send({ status })
        .expect(200);
    }

    const freed = await request(server())
      .get(`/drivers/${driver.body.id}`)
      .expect(200);
    expect(freed.body.status).toBe('AVAILABLE');
  });

  it('GET /drivers/available is not swallowed by /drivers/:id', () => {
    return request(server()).get('/drivers/available').expect(200);
  });

  it('returns 400 for invalid coordinates', () => {
    return request(server())
      .post('/drivers')
      .send({ name: 'Bad', location: { lat: 999, lng: 3 } })
      .expect(400);
  });

  it('returns 409 when no driver is available', () => {
    return request(server())
      .post('/rides')
      .send({
        riderId: 'rider-1',
        pickup: { lat: 36.75, lng: 3.05 },
        dropoff: { lat: 36.72, lng: 3.08 },
      })
      .expect(409);
  });

  it('returns 404 for an unknown ride', () => {
    return request(server())
      .get('/rides/7c9e6679-7425-40de-944b-e07fc1f90ae7')
      .expect(404);
  });

  it('returns 400 for an invalid transition', async () => {
    await request(server())
      .post('/drivers')
      .send({ name: 'D', location: { lat: 36.75, lng: 3.05 } });
    const ride = await request(server())
      .post('/rides')
      .send({
        riderId: 'r',
        pickup: { lat: 36.75, lng: 3.05 },
        dropoff: { lat: 36.72, lng: 3.08 },
      });

    return request(server())
      .patch(`/rides/${ride.body.id}/status`)
      .send({ status: 'COMPLETED' })
      .expect(400);
  });
});
