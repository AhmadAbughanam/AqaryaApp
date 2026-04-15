import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {AccountType, InvestmentOpportunity, InvestmentOpportunityStatus, Property, PropertyStatus, Prisma, ProviderProfile, ProviderVerificationStatus, User} from '@prisma/client';
import {AnalyticsService} from '../analytics/analytics.service';
import {AuditService} from '../audit/audit.service';
import {AuthUser} from '../common/auth-user';
import {PrismaService} from '../common/prisma.service';
import {VerificationService} from '../verification/verification.service';
import {GetAuditLogsDto} from './dto/get-audit-logs.dto';
import {CreateInvestmentOpportunityDto} from './dto/create-investment-opportunity.dto';
import {ReviewInvestmentOpportunityDto} from './dto/review-investment-opportunity.dto';
import {ReviewProviderDto} from './dto/review-provider.dto';

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
      'needs_changes',
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

    if (property.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'listing_status_change',
          title: 'Listing verified',
          body: `Your listing "${property.title}" has been verified and is now live on the marketplace.`,
          data: {propertyId},
        },
      });
    }

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

    if (property.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'listing_status_change',
          title: 'Listing rejected',
          body: `Your listing "${property.title}" was rejected. Reason: ${reason}`,
          data: {propertyId, reason},
        },
      });
    }

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

  async requestPropertyChanges(propertyId: string, notes: string, user: AuthUser) {
    const property = await this.requireProperty(propertyId);
    if (property.status === 'sold') {
      throw new BadRequestException('Sold listings cannot be sent back for changes.');
    }

    const updated = await this.prisma.property.update({
      where: {id: propertyId},
      data: {
        status: 'needs_changes',
        reviewerNotes: notes,
        rejectionReason: null,
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'listing_changes_requested',
      propertyId,
      metadata: {
        previousStatus: property.status,
        newStatus: updated.status,
        notes,
      },
    });

    if (property.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'listing_status_change',
          title: 'Changes requested on your listing',
          body: `Your listing "${property.title}" requires changes before it can be verified. Reviewer notes: ${notes}`,
          data: {propertyId, notes},
        },
      });
    }

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

  async getDashboardSummary() {
    const [
      pendingListings,
      pendingOpportunities,
      underReviewOpportunities,
      openThreads,
      totalUsers,
      recentAuditLogs,
      pendingProviders,
      openReports,
      flaggedItems,
      activeAnnouncements,
    ] = await Promise.all([
      this.prisma.property.count({where: {status: 'pending_verification'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'submitted'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'under_review'}}),
      this.prisma.thread.count(),
      this.prisma.user.count({where: {role: 'citizen'}}),
      this.prisma.auditLog.findMany({
        orderBy: {timestamp: 'desc'},
        take: 5,
        include: {
          actor: {select: {username: true}},
        },
      }),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'under_review'}}),
      this.prisma.moderationReport.count({where: {status: {in: ['open', 'under_review']}}}),
      this.prisma.qualityFlag.count({where: {resolvedAt: null}}),
      this.prisma.announcement.count({where: {status: 'active'}}),
    ]);

    return {
      pendingListings,
      pendingOpportunities: pendingOpportunities + underReviewOpportunities,
      openThreads,
      totalCitizenUsers: totalUsers,
      pendingProviders,
      openReports,
      flaggedItems,
      activeAnnouncements,
      recentAuditHighlights: recentAuditLogs.map(log => ({
        id: log.id,
        actionType: log.actionType,
        actorName: log.actor?.username ?? 'System',
        actorRole: log.actorRole,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata,
      })),
    };
  }

  // ─── Investment Opportunity admin methods ────────────────────────────────────

  async createInvestmentOpportunity(dto: CreateInvestmentOpportunityDto, user: AuthUser) {
    const opp = await this.prisma.investmentOpportunity.create({
      data: {
        status: 'submitted',
        title: dto.title,
        location: dto.location,
        description: dto.description,
        imageUrls: dto.imageUrls ?? [],
        assetClass: dto.assetClass,
        stage: dto.stage,
        sponsorName: dto.sponsorName,
        ownershipStructure: dto.ownershipStructure,
        distributionModel: dto.distributionModel,
        exitModel: dto.exitModel,
        totalShares: dto.totalShares,
        availableShares: dto.totalShares,
        pricePerShare: dto.pricePerShare,
        minimumShares: dto.minimumShares,
        targetIrr: dto.targetIrr,
        targetCashYield: dto.targetCashYield,
        targetHoldYears: dto.targetHoldYears,
        appreciationRate: dto.appreciationRate,
        occupancyRate: dto.occupancyRate,
        managementFeeRate: dto.managementFeeRate,
        riskBand: dto.riskBand,
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'opportunity_submitted',
      metadata: {opportunityId: opp.id, title: opp.title},
    });

    return this.mapAdminOpportunity(opp);
  }

  async getInvestmentOpportunities(status?: string) {
    const allowedStatuses: InvestmentOpportunityStatus[] = [
      'draft', 'submitted', 'under_review', 'approved', 'published', 'rejected',
    ];

    const where: Prisma.InvestmentOpportunityWhereInput =
      !status || status === 'all'
        ? {}
        : {
            status: allowedStatuses.includes(status as InvestmentOpportunityStatus)
              ? (status as InvestmentOpportunityStatus)
              : 'submitted',
          };

    const opps = await this.prisma.investmentOpportunity.findMany({
      where,
      orderBy: {updatedAt: 'desc'},
    });

    return opps.map(opp => this.mapAdminOpportunity(opp));
  }

  async getInvestmentOpportunityDetails(opportunityId: string) {
    const opp = await this.prisma.investmentOpportunity.findUnique({
      where: {id: opportunityId},
    });

    if (!opp) {
      throw new NotFoundException('Investment opportunity not found.');
    }

    const fundingGoal = opp.totalShares * opp.pricePerShare;
    const fundedAmount = (opp.totalShares - opp.availableShares) * opp.pricePerShare;

    return {
      ...this.mapAdminOpportunity(opp),
      description: opp.description,
      imageUrls: this.parseImageUrls(opp.imageUrls),
      ownershipStructure: opp.ownershipStructure,
      distributionModel: opp.distributionModel,
      exitModel: opp.exitModel,
      totalShares: opp.totalShares,
      availableShares: opp.availableShares,
      pricePerShare: opp.pricePerShare,
      minimumShares: opp.minimumShares,
      fundingGoal: Number(fundingGoal.toFixed(2)),
      fundedAmount: Number(fundedAmount.toFixed(2)),
      targetIrr: opp.targetIrr,
      targetCashYield: opp.targetCashYield,
      targetHoldYears: opp.targetHoldYears,
      appreciationRate: opp.appreciationRate,
      occupancyRate: opp.occupancyRate,
      managementFeeRate: opp.managementFeeRate,
      reviewNotes: opp.reviewNotes,
      rejectionReason: opp.rejectionReason,
      publishedAt: opp.publishedAt?.toISOString() ?? null,
      reviewedAt: opp.reviewedAt?.toISOString() ?? null,
      reviewedBy: opp.reviewedBy,
      verificationRecordId: opp.verificationRecordId,
      blockchainHash: opp.blockchainHash,
      blockchainTxId: opp.blockchainTxId,
      blockchainStatus: opp.blockchainStatus,
      anchoredAt: opp.anchoredAt?.toISOString() ?? null,
    };
  }

  async reviewInvestmentOpportunity(
    opportunityId: string,
    dto: ReviewInvestmentOpportunityDto,
    user: AuthUser,
  ) {
    const opp = await this.prisma.investmentOpportunity.findUnique({where: {id: opportunityId}});
    if (!opp) {
      throw new NotFoundException('Investment opportunity not found.');
    }

    let newStatus: InvestmentOpportunityStatus;
    let auditAction: 'opportunity_approved' | 'opportunity_rejected' | 'opportunity_published' | 'opportunity_unpublished';

    if (dto.action === 'approve') {
      if (!['submitted', 'under_review'].includes(opp.status)) {
        throw new BadRequestException('Only submitted or under-review opportunities can be approved.');
      }
      newStatus = 'approved';
      auditAction = 'opportunity_approved';
    } else if (dto.action === 'reject') {
      if (opp.status === 'published') {
        throw new BadRequestException('Published opportunities must be unpublished before rejection.');
      }
      newStatus = 'rejected';
      auditAction = 'opportunity_rejected';
    } else if (dto.action === 'publish') {
      if (opp.status !== 'approved') {
        throw new BadRequestException('Only approved opportunities can be published.');
      }
      newStatus = 'published';
      auditAction = 'opportunity_published';
    } else {
      // unpublish
      if (opp.status !== 'published') {
        throw new BadRequestException('Only published opportunities can be unpublished.');
      }
      newStatus = 'approved';
      auditAction = 'opportunity_unpublished';
    }

    const trustScore = dto.action === 'publish' ? this.calculateTrustScore(opp) : opp.trustScore;
    const trustBadge = trustScore != null ? this.deriveTrustBadge(trustScore) : opp.trustBadge;

    const updated = await this.prisma.investmentOpportunity.update({
      where: {id: opportunityId},
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: user.sub,
        reviewNotes: dto.notes ?? opp.reviewNotes,
        rejectionReason: dto.action === 'reject' ? (dto.notes ?? 'No reason provided.') : opp.rejectionReason,
        publishedAt: dto.action === 'publish' ? new Date() : opp.publishedAt,
        trustScore: dto.action === 'publish' ? trustScore : opp.trustScore,
        trustBadge: dto.action === 'publish' ? trustBadge : opp.trustBadge,
      },
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: auditAction,
      metadata: {
        opportunityId,
        previousStatus: opp.status,
        newStatus: updated.status,
        notes: dto.notes,
        trustScore,
        trustBadge,
      },
    });

    return this.mapAdminOpportunity(updated);
  }

  async getUsers(accountType?: string, providerStatus?: string) {
    const profileFilter: Prisma.ProviderProfileWhereInput = {};
    if (accountType) {
      profileFilter.accountType = accountType as AccountType;
    }
    if (providerStatus) {
      profileFilter.providerVerificationStatus = providerStatus as ProviderVerificationStatus;
    }

    const hasFilter = Object.keys(profileFilter).length > 0;

    const users = await this.prisma.user.findMany({
      where: hasFilter ? {providerProfile: profileFilter} : {},
      include: {
        providerProfile: true,
        _count: {select: {ownedProperties: true, simulations: true, threads: true}},
      },
      orderBy: {createdAt: 'desc'},
    });

    return users.map(u => this.mapAdminUser(u));
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      include: {
        providerProfile: true,
        _count: {
          select: {ownedProperties: true, simulations: true, threads: true, notifications: true},
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.mapAdminUserDetail(user);
  }

  async reviewProvider(userId: string, dto: ReviewProviderDto, admin: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      include: {providerProfile: true},
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.providerProfile) {
      throw new BadRequestException('User does not have a provider profile.');
    }
    if (dto.action === 'reject' && !dto.notes?.trim()) {
      throw new BadRequestException('A rejection reason is required when rejecting a provider.');
    }

    const previousStatus = user.providerProfile.providerVerificationStatus;

    const updateData: Prisma.ProviderProfileUpdateInput = {
      reviewedAt: new Date(),
      reviewedBy: admin.sub,
    };

    let newStatus: ProviderVerificationStatus = previousStatus;
    let auditAction: 'provider_under_review' | 'provider_verified' | 'provider_rejected' | 'provider_suspended' | 'provider_notes_updated';

    if (dto.action === 'under_review') {
      newStatus = 'under_review';
      auditAction = 'provider_under_review';
      updateData.providerVerificationStatus = 'under_review';
    } else if (dto.action === 'verify') {
      newStatus = 'verified';
      auditAction = 'provider_verified';
      updateData.providerVerificationStatus = 'verified';
      if (dto.notes) {
        updateData.adminNotes = dto.notes;
      }
    } else if (dto.action === 'reject') {
      newStatus = 'rejected';
      auditAction = 'provider_rejected';
      updateData.providerVerificationStatus = 'rejected';
      updateData.rejectionReason = dto.notes;
    } else if (dto.action === 'suspend') {
      newStatus = 'suspended';
      auditAction = 'provider_suspended';
      updateData.providerVerificationStatus = 'suspended';
      if (dto.notes) {
        updateData.adminNotes = dto.notes;
      }
    } else {
      auditAction = 'provider_notes_updated';
      if (dto.notes !== undefined) {
        updateData.adminNotes = dto.notes;
      }
    }

    await this.prisma.providerProfile.update({
      where: {userId},
      data: updateData,
    });

    await this.auditService.log({
      actorId: admin.sub,
      actorRole: admin.role,
      actionType: auditAction,
      metadata: {userId, previousStatus, newStatus, notes: dto.notes},
    });

    if (dto.action === 'verify' || dto.action === 'reject' || dto.action === 'suspend') {
      const notifBodyMap: Record<'verify' | 'reject' | 'suspend', {title: string; body: string}> = {
        verify: {
          title: 'Provider account verified',
          body: 'Your provider account has been verified. You now have full provider access on Aqarya.',
        },
        reject: {
          title: 'Provider account rejected',
          body: `Your provider account application was rejected. Reason: ${dto.notes ?? 'No reason provided.'}`,
        },
        suspend: {
          title: 'Provider account suspended',
          body: 'Your provider account has been suspended. Please contact support for details.',
        },
      };
      const notif = notifBodyMap[dto.action];
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'provider_status_change',
          title: notif.title,
          body: notif.body,
          data: {userId, previousStatus, newStatus},
        },
      });
    }

    return this.getUserDetail(userId);
  }

  private calculateTrustScore(opp: InvestmentOpportunity): number {
    let score = 0;
    // Known/established sponsor name
    if (opp.sponsorName && opp.sponsorName.length > 5) score += 30;
    // Has blockchain record
    if (opp.blockchainHash) score += 20;
    // Has verification record
    if (opp.verificationRecordId) score += 20;
    // Has complete financial data (irr, yield, hold years all set)
    if (opp.targetIrr > 0 && opp.targetCashYield > 0 && opp.targetHoldYears > 0) score += 15;
    // Has images
    if (Array.isArray(opp.imageUrls) && (opp.imageUrls as unknown[]).length > 0) score += 10;
    // Conservative risk band bonus
    if (opp.riskBand === 'Conservative' || opp.riskBand === 'Balanced') score += 5;
    return Math.min(100, score);
  }

  private deriveTrustBadge(score: number) {
    if (score >= 85) return 'aqarya_approved' as const;
    if (score >= 65) return 'premium_verified' as const;
    return 'verified' as const;
  }

  private mapAdminOpportunity(opp: InvestmentOpportunity) {
    return {
      id: opp.id,
      title: opp.title,
      location: opp.location,
      sponsorName: opp.sponsorName,
      assetClass: opp.assetClass,
      stage: opp.stage,
      riskBand: opp.riskBand,
      status: opp.status,
      trustScore: opp.trustScore,
      trustBadge: opp.trustBadge,
      pricePerShare: opp.pricePerShare,
      totalShares: opp.totalShares,
      availableShares: opp.availableShares,
      targetIrr: opp.targetIrr,
      targetCashYield: opp.targetCashYield,
      targetHoldYears: opp.targetHoldYears,
      createdAt: opp.createdAt.toISOString(),
      updatedAt: opp.updatedAt.toISOString(),
    };
  }

  // ─── Property helpers ────────────────────────────────────────────────────────

  private mapAdminUser(
    user: User & {
      providerProfile: ProviderProfile | null;
      _count: {ownedProperties: number; simulations: number; threads: number};
    },
  ) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      providerProfile: user.providerProfile
        ? {
            accountType: user.providerProfile.accountType,
            providerVerificationStatus: user.providerProfile.providerVerificationStatus,
            businessName: user.providerProfile.businessName,
            contactPerson: user.providerProfile.contactPerson,
          }
        : null,
      counts: {
        properties: user._count.ownedProperties,
        simulations: user._count.simulations,
        threads: user._count.threads,
      },
    };
  }

  private mapAdminUserDetail(
    user: User & {
      providerProfile: ProviderProfile | null;
      _count: {ownedProperties: number; simulations: number; threads: number; notifications: number};
    },
  ) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      counts: {
        properties: user._count.ownedProperties,
        simulations: user._count.simulations,
        threads: user._count.threads,
        notifications: user._count.notifications,
      },
      providerProfile: user.providerProfile
        ? {
            accountType: user.providerProfile.accountType,
            providerVerificationStatus: user.providerProfile.providerVerificationStatus,
            businessName: user.providerProfile.businessName,
            contactPerson: user.providerProfile.contactPerson,
            phone: user.providerProfile.phone,
            email: user.providerProfile.email,
            registrationNumber: user.providerProfile.registrationNumber,
            licenseNumber: user.providerProfile.licenseNumber,
            providerType: user.providerProfile.providerType,
            documentUrls: this.parseImageUrls(user.providerProfile.documentUrls),
            adminNotes: user.providerProfile.adminNotes,
            rejectionReason: user.providerProfile.rejectionReason,
            submittedAt: user.providerProfile.submittedAt?.toISOString() ?? null,
            reviewedAt: user.providerProfile.reviewedAt?.toISOString() ?? null,
            reviewedBy: user.providerProfile.reviewedBy,
            createdAt: user.providerProfile.createdAt.toISOString(),
            updatedAt: user.providerProfile.updatedAt.toISOString(),
          }
        : null,
    };
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
      reviewerNotes: property.reviewerNotes,
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
