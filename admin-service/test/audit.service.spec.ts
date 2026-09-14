import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../src/audit/audit.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditStatus } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should persist audit log to DB successfully', async () => {
    const mockRecord = {
      id: 'aud-1',
      adminUserId: 'adm-123',
      adminEmail: 'admin@market.com',
      action: 'SELLER_SUSPENDED',
      resourceType: 'SELLER',
      resourceId: 'sel-456',
      reason: 'Fraudulent listings',
      status: AuditStatus.SUCCESS,
      createdAt: new Date(),
    };
    mockPrisma.auditLog.create.mockResolvedValue(mockRecord);

    const result = await service.logAction({
      adminUserId: 'adm-123',
      adminEmail: 'admin@market.com',
      action: 'SELLER_SUSPENDED',
      resourceType: 'SELLER',
      resourceId: 'sel-456',
      reason: 'Fraudulent listings',
    });

    expect(result).toEqual(mockRecord);
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('should buffer in memory if DB write fails', async () => {
    mockPrisma.auditLog.create.mockRejectedValue(new Error('DB unreachable'));

    const result = await service.logAction({
      adminUserId: 'adm-123',
      action: 'ORDER_CANCELLED',
      resourceType: 'ORDER',
      resourceId: 'ord-999',
      reason: 'Customer requested',
    });

    expect(result.id).toMatch(/^mem-/);
    expect(result.action).toBe('ORDER_CANCELLED');

    mockPrisma.auditLog.count.mockRejectedValue(new Error('DB unreachable'));
    const logs = await service.getAuditLogs({ resourceType: 'ORDER' });
    expect(logs.data.length).toBeGreaterThan(0);
    expect(logs.data[0].resourceId).toBe('ord-999');
  });
});
