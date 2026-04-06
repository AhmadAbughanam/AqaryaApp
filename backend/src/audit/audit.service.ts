import {Injectable} from '@nestjs/common';
import {AuditActionType, Prisma, UserRole} from '@prisma/client';
import {PrismaService} from '../common/prisma.service';

export interface LogAuditInput {
  actorId?: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  propertyId?: string;
  metadata: Record<string, unknown>;
}

export interface GetAuditLogsParams {
  page: number;
  limit: number;
  actionType?: AuditActionType;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: LogAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorRole: input.actorRole,
        actionType: input.actionType,
        propertyId: input.propertyId,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getLogs(params: GetAuditLogsParams) {
    const where: Prisma.AuditLogWhereInput = {
      actionType: params.actionType,
      timestamp: {
        gte: params.dateFrom,
        lte: params.dateTo,
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {timestamp: 'desc'},
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.auditLog.count({where}),
    ]);

    return {
      items: items.map(log => ({
        id: log.id,
        actorName: log.actor?.username ?? 'System',
        actorRole: log.actorRole,
        actionType: log.actionType,
        propertyId: log.propertyId ?? '',
        timestamp: log.timestamp,
        metadata: log.metadata as Record<string, unknown>,
      })),
      page: params.page,
      limit: params.limit,
      total,
    };
  }
}
