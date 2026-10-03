import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { DriverRepository } from './drivers.repository.js';
import { DriverService } from './drivers.service.js';

describe('DriverService', () => {
  let driverService: DriverService;

  // Mock only the repository: we're testing the service's rules (404 / 409),
  // not how the data is stored.
  const mockDriverRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findAvailable: vi.fn(),
    update: vi.fn(),
    claimNearestAvailable: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        DriverService,
        { provide: DriverRepository, useValue: mockDriverRepository },
      ],
    }).compile();

    driverService = module.get(DriverService);
  });

  it('throws 404 when the driver does not exist', async () => {
    mockDriverRepository.findById.mockResolvedValue(undefined);

    await expect(driverService.getDriverById(randomUUID())).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns the claimed driver when one is available', async () => {
    const driver = { id: randomUUID(), name: 'D' };
    mockDriverRepository.claimNearestAvailable.mockResolvedValue(driver);

    await expect(
      driverService.assignNearestDriver({ lat: 36.75, lng: 3.06 }),
    ).resolves.toBe(driver);
  });

  it('throws 409 when no driver is available', async () => {
    mockDriverRepository.claimNearestAvailable.mockResolvedValue(undefined);

    await expect(
      driverService.assignNearestDriver({ lat: 36.75, lng: 3.06 }),
    ).rejects.toThrow(ConflictException);
  });
});
