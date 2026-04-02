import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Property, PropertyStatus, Prisma} from '@prisma/client';
import {AnalyticsService} from '../analytics/analytics.service';
import {AuditService} from '../audit/audit.service';
import {AuthUser} from '../common/auth-user';
import {PrismaService} from '../common/prisma.service';
import {VerificationService} from '../verification/verification.service';
import {GetAuditLogsDto} from './dto/get-audit-logs.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
    private readonly verificationService: VerificationService,
  ) {}

  async getProperties(status = 'all') {
    const allowedStatuses: PropertyStatus[] = [
      'pending_verification',
      'verified',
      'rejected',
      'frozen',
      'sold',
    ];

    const where: Prisma.PropertyWhereInput =
      status === 'all'
        ? {}
        : {
            status: allowedStatuses.includes(status as PropertyStatus)
              ? (status as PropertyStatus)
              : 'pending_verification',
          };

    const properties = await this.prisma.property.findMany({
      where,
      orderBy: [{updatedAt: 'desc'}],
    });

    return properties.map(property => this.mapAdminProperty(property));
  }

  async getPropertyDetails(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: {id: propertyId},
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        auditLogs: {
          orderBy: {timestamp: 'desc'},
          include: {
            actor: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    return {
      ...this.mapAdminProperty(property),
      price: property.price,
      propertyValue: property.propertyValue,
      totalShares: property.totalShares,
      availableShares: property.availableShares,
      ownershipType: property.ownershipType,
      ownershipProofType: property.ownershipProofType,
      ownershipProofNumber: property.ownershipProofNumber,
      description: property.description,
      imageUrls: this.parseImageUrls(property.imageUrls),
      verificationRecordId: property.verificationRecordId,
      verificationPayload: property.verificationPayload,
      seller: property.owner
        ? {
            id: property.owner.id,
            username: property.owner.username,
            role: property.owner.role,
          }
        : null,
      auditEvents: property.auditLogs.map(log => ({
        id: log.id,
        actorId: log.actor?.id ?? null,
        actorName: log.actor?.username ?? 'System',
        actorRole: log.actorRole,
        actionType: log.actionType,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata,
      })),
    };
  }

  async verifyProperty(propertyId: string, user: AuthUser) {
    const property = await this.requireProperty(propertyId);
    if (property.status === 'verified') {
      return this.mapAdminProperty(property);
    }
    if (property.status === 'sold') {
      throw new BadRequestException('Sold listings cannot be re-verified.');
    }

    const updated = await this.prisma.property.update({
      where: {id: propertyId},
      data: {
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        rejectionReason: null,
        verificationTimestamp: new Date(),
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'listing_verified',
      propertyId,
      metadata: {
        previousStatus: property.status,
        newStatus: updated.status,
      },
    });

    return this.mapAdminProperty(updated);
  }

  async rejectProperty(propertyId: string, reason: string, user: AuthUser) {
    const property = await this.requireProperty(propertyId);
    if (property.status === 'sold') {
      throw new BadRequestException('Sold listings cannot be rejected.');
    }

    const updated = await this.prisma.property.update({
      where: {id: propertyId},
      data: {
        status: 'rejected',
        propertyVerificationStatus: 'rejected',
        identityVerificationStatus: 'rejected',
        rejectionReason: reason,
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'listing_rejected',
      propertyId,
      metadata: {
        previousStatus: property.status,
        newStatus: updated.status,
        reason,
      },
    });

    return this.mapAdminProperty(updated);
  }

  async freezeProperty(propertyId: string, user: AuthUser) {
    const property = await this.requireProperty(propertyId);
    if (property.status === 'frozen') {
      return this.mapAdminProperty(property);
    }

    const updated = await this.prisma.property.update({
      where: {id: propertyId},
      data: {
        status: 'frozen',
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'listing_frozen',
      propertyId,
      metadata: {
        previousStatus: property.status,
        newStatus: updated.status,
      },
    });

    return this.mapAdminProperty(updated);
  }

  async anchorProperty(propertyId: string, user: AuthUser) {
    const property = await this.requireProperty(propertyId);
    if (property.status !== 'verified') {
      throw new BadRequestException('Only verified properties can be anchored.');
    }
    if (!property.blockchainHash) {
      throw new BadRequestException('Property hash is missing for anchoring.');
    }

    const anchor = this.verificationService.buildAnchorRecord(
      property.id,
      property.blockchainHash,
      user.sub,
    );

    const updated = await this.prisma.property.update({
      where: {id: propertyId},
      data: {
        blockchainTxId: anchor.blockchainTxId,
        anchoredAt: anchor.anchoredAt,
        blockchainStatus: anchor.blockchainStatus,
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'anchor',
      propertyId,
      metadata: {
        blockchainHash: updated.blockchainHash,
        blockchainTxId: updated.blockchainTxId,
        anchoredAt: anchor.anchoredAt.toISOString(),
      },
    });

    return {
      property: this.mapAdminProperty(updated),
      anchor: {
        blockchainHash: updated.blockchainHash,
        blockchainTransactionId: updated.blockchainTxId,
        anchoredAt: anchor.anchoredAt.toISOString(),
      },
    };
  }

  getAuditLogs(dto: GetAuditLogsDto) {
    return this.auditService.getLogs({
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      actionType: dto.actionType,
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.dateTo ? new Date(dto.dateTo) : undefined,
    });
  }

  getAnalytics() {
    return this.analyticsService.getSummary();
  }

  private async requireProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({where: {id: propertyId}});
    if (!property) {
      throw new NotFoundException('Property not found.');
    }
    return property;
  }

  private mapAdminProperty(property: Property) {
    return {
      id: property.id,
      title: property.title,
      ownerName: property.ownerName,
      location: property.location,
      submissionDate: property.createdAt.toISOString(),
      verificationStatus: property.status,
      propertyVerificationStatus: property.propertyVerificationStatus,
      identityVerificationStatus: property.identityVerificationStatus,
      rejectionReason: property.rejectionReason,
      verificationRecordId: property.verificationRecordId,
      blockchainHash: property.blockchainHash,
      blockchainTransactionId: property.blockchainTxId,
      blockchainStatus: property.blockchainStatus,
      anchoredAt: property.anchoredAt?.toISOString() ?? null,
      updatedAt: property.updatedAt.toISOString(),
    };
  }

  private parseImageUrls(imageUrls: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(imageUrls)) {
      return [];
    }

    return imageUrls.filter((value): value is string => typeof value === 'string');
  }
}
