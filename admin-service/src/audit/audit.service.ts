import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto/audit.dto';
import { AuditStatus } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private inMemoryLogs: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async logAction(dto: CreateAuditLogDto) {
    this.logger.log(
      `[AUDIT] Admin: ${dto.adminUserId} performed ${dto.action} on ${dto.resourceType}:${dto.resourceId} status: ${dto.status || AuditStatus.SUCCESS}`,
    );

    try {
      return await this.prisma.auditLog.create({
        data: {
          adminUserId: dto.adminUserId,
          adminEmail: dto.adminEmail,
          action: dto.action,
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
          oldValue: dto.oldValue ? JSON.parse(JSON.stringify(dto.oldValue)) : null,
          newValue: dto.newValue ? JSON.parse(JSON.stringify(dto.newValue)) : null,
          reason: dto.reason,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          requestId: dto.requestId,
          status: dto.status || AuditStatus.SUCCESS,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to persist audit log to DB: ${err.message}. Buffering in memory.`);
      const memRecord = {
        id: `mem-${Date.now()}`,
        ...dto,
        status: dto.status || AuditStatus.SUCCESS,
        createdAt: new Date(),
      };
      this.inMemoryLogs.unshift(memRecord);
      if (this.inMemoryLogs.length > 500) this.inMemoryLogs.pop();
      return memRecord;
    }
  }

  async getAuditLogs(query: QueryAuditLogDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.adminUserId) where.adminUserId = query.adminUserId;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.resourceId) where.resourceId = query.resourceId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    try {
      const [total, logs] = await Promise.all([
        this.prisma.auditLog.count({ where }),
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err: any) {
      this.logger.warn(`DB audit query failed: ${err.message}. Returning in-memory logs.`);
      const filtered = this.inMemoryLogs.filter((l) => {
        if (query.adminUserId && l.adminUserId !== query.adminUserId) return false;
        if (query.action && l.action !== query.action) return false;
        if (query.resourceType && l.resourceType !== query.resourceType) return false;
        if (query.resourceId && l.resourceId !== query.resourceId) return false;
        return true;
      });

      return {
        data: filtered.slice(skip, skip + limit),
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
        },
      };
    }
  }

  async getAuditLogById(id: string) {
    try {
      return await this.prisma.auditLog.findUnique({
        where: { id },
      });
    } catch {
      return this.inMemoryLogs.find((l) => l.id === id) || null;
    }
  }
}
