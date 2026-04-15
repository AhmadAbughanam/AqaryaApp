import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {ModerationReport, Prisma, ReportStatus, ReportTargetType} from '@prisma/client';
import {AuditService} from '../audit/audit.service';
import {AuthUser} from '../common/auth-user';
import {PrismaService} from '../common/prisma.service';
import {CreateReportDto} from './dto/create-report.dto';
import {GetReportsDto} from './dto/get-reports.dto';
import {ModerateAction} from './dto/moderate-report.dto';
import {QualityFlagsService} from './quality-flags.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly qualityFlagsService: QualityFlagsService,
  ) {}

  // ─── Citizen: report a listing ────────────────────────────────────────────────

  async createListingReport(userId: string, propertyId: string, dto: CreateReportDto) {
    const property = await this.prisma.property.findUnique({where: {id: propertyId}});
    if (!property) {
      throw new NotFoundException('Listing not found.');
    }
    if (!['verified', 'pending_verification', 'needs_changes'].includes(property.status)) {
      throw new BadRequestException('Reports can only be submitted for active listings.');
    }

    const existing = await this.prisma.moderationReport.findFirst({
      where: {
        targetType: 'listing',
        targetId: propertyId,
        reporterId: userId,
        status: {in: ['open', 'under_review']},
      },
    });
    if (existing) {
      throw new BadRequestException('You already have an open report on this listing.');
    }

    const report = await this.prisma.moderationReport.create({
      data: {
        targetType: 'listing',
        targetId: propertyId,
        reporterId: userId,
        reason: dto.reason,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: 'citizen',
      actionType: 'report_created',
      propertyId,
      metadata: {reportId: report.id, reason: report.reason, targetType: 'listing'},
    });

    // Compute quality flags for this listing now that it has a report
    void this.qualityFlagsService.computeAndPersistForListing(propertyId);

    return {id: report.id, status: report.status};
  }

  // ─── Citizen: report an opportunity ──────────────────────────────────────────

  async createOpportunityReport(userId: string, opportunityId: string, dto: CreateReportDto) {
    const opp = await this.prisma.investmentOpportunity.findUnique({
      where: {id: opportunityId},
    });
    if (!opp) {
      throw new NotFoundException('Investment opportunity not found.');
    }
    if (!['published', 'approved', 'submitted', 'under_review'].includes(opp.status)) {
      throw new BadRequestException('Reports can only be submitted for active opportunities.');
    }

    const existing = await this.prisma.moderationReport.findFirst({
      where: {
        targetType: 'opportunity',
        targetId: opportunityId,
        reporterId: userId,
        status: {in: ['open', 'under_review']},
      },
    });
    if (existing) {
      throw new BadRequestException('You already have an open report on this opportunity.');
    }

    const report = await this.prisma.moderationReport.create({
      data: {
        targetType: 'opportunity',
        targetId: opportunityId,
        reporterId: userId,
        reason: dto.reason,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: 'citizen',
      actionType: 'report_created',
      metadata: {reportId: report.id, reason: report.reason, targetType: 'opportunity', opportunityId},
    });

    void this.qualityFlagsService.computeAndPersistForOpportunity(opportunityId);

    return {id: report.id, status: report.status};
  }

  // ─── Admin: list reports with filters ────────────────────────────────────────

  async getReports(dto: GetReportsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ModerationReportWhereInput = {};
    if (dto.targetType) where.targetType = dto.targetType;
    if (dto.status) where.status = dto.status;
    if (dto.reason) where.reason = dto.reason;

    const [items, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: {createdAt: 'desc'},
        include: {
          reporter: {select: {id: true, username: true}},
        },
      }),
      this.prisma.moderationReport.count({where}),
    ]);

    const enriched = await Promise.all(items.map(report => this.enrichReportRow(report)));

    return {items: enriched, total, page, limit};
  }

  // ─── Admin: report detail ─────────────────────────────────────────────────────

  async getReportDetail(reportId: string) {
    const report = await this.prisma.moderationReport.findUnique({
      where: {id: reportId},
      include: {reporter: {select: {id: true, username: true}}},
    });
    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    const [entitySummary, qualityFlags] = await Promise.all([
      this.loadEntitySummary(report.targetType, report.targetId),
      this.qualityFlagsService.getFlagsForTarget(report.targetType, report.targetId),
    ]);

    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      notes: report.notes,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
      reviewedBy: report.reviewedBy,
      reporter: report.reporter,
      entitySummary,
      qualityFlags: qualityFlags.map(f => ({
        id: f.id,
        rule: f.rule,
        severity: f.severity,
        details: f.details,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  // ─── Admin: take action on a report ──────────────────────────────────────────

  async moderateReport(reportId: string, action: ModerateAction, admin: AuthUser) {
    const report = await this.prisma.moderationReport.findUnique({where: {id: reportId}});
    if (!report) {
      throw new NotFoundException('Report not found.');
    }
    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new BadRequestException('Report is already closed.');
    }

    let newStatus: ReportStatus;
    if (action === 'mark_under_review') {
      newStatus = 'under_review';
    } else if (action === 'resolve') {
      newStatus = 'resolved';
    } else {
      newStatus = 'dismissed';
    }

    const updated = await this.prisma.moderationReport.update({
      where: {id: reportId},
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: admin.sub,
      },
    });

    await this.auditService.log({
      actorId: admin.sub,
      actorRole: admin.role,
      actionType: 'report_reviewed',
      metadata: {
        reportId,
        targetType: report.targetType,
        targetId: report.targetId,
        action,
        previousStatus: report.status,
        newStatus,
      },
    });

    // Notify the reporter if the report was resolved or dismissed
    if (newStatus === 'resolved' || newStatus === 'dismissed') {
      const notifTitle = newStatus === 'resolved' ? 'Your report was resolved' : 'Your report was reviewed';
      const notifBody =
        newStatus === 'resolved'
          ? `Your report on a ${report.targetType} has been reviewed and resolved.`
          : `Your report on a ${report.targetType} was reviewed and no action was taken.`;

      await this.prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: 'report_update',
          title: notifTitle,
          body: notifBody,
          data: {reportId, targetType: report.targetType, targetId: report.targetId},
        },
      });
    }

    return {
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      reviewedBy: updated.reviewedBy,
    };
  }

  // ─── Counts for dashboard ─────────────────────────────────────────────────────

  async getOpenReportCount(): Promise<number> {
    return this.prisma.moderationReport.count({
      where: {status: {in: ['open', 'under_review']}},
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async enrichReportRow(
    report: ModerationReport & {reporter: {id: string; username: string}},
  ) {
    const summary = await this.loadEntitySummary(report.targetType, report.targetId);
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      notes: report.notes,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
      reviewedBy: report.reviewedBy,
      reporter: {id: report.reporter.id, username: report.reporter.username},
      entityTitle: summary?.title ?? null,
      entityLocation: summary?.location ?? null,
    };
  }

  private async loadEntitySummary(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<{title: string; location: string; status: string} | null> {
    if (targetType === 'listing') {
      const property = await this.prisma.property.findUnique({
        where: {id: targetId},
        select: {title: true, location: true, status: true},
      });
      if (!property) return null;
      return {title: property.title, location: property.location, status: property.status};
    }

    const opp = await this.prisma.investmentOpportunity.findUnique({
      where: {id: targetId},
      select: {title: true, location: true, status: true},
    });
    if (!opp) return null;
    return {title: opp.title, location: opp.location, status: opp.status};
  }
}
