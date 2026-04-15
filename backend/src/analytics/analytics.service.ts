import {Injectable} from '@nestjs/common';
import {PrismaService} from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      // ─ Properties ──────────────────────────────────────────────────────────
      totalProperties,
      verifiedProperties,
      pendingVerificationProperties,
      needsChangesProperties,
      rejectedProperties,
      frozenProperties,
      soldProperties,
      totalSimulations,
      anchoredRecords,
      lastAnchoredRecord,
      totalSimulationVolumeAgg,

      // ─ Investment opportunities ────────────────────────────────────────────
      investDraft,
      investSubmitted,
      investUnderReview,
      investApproved,
      investPublished,
      investRejected,
      totalInvestmentSimulations,
      investSimVolumeAgg,

      // ─ Providers ───────────────────────────────────────────────────────────
      providersTotal,
      providersUnverified,
      providersUnderReview,
      providersVerified,
      providersRejected,
      providersSuspended,

      // ─ Moderation ──────────────────────────────────────────────────────────
      reportsOpen,
      reportsUnderReview,
      reportsResolved,
      reportsDismissed,
      unresolvedQualityFlags,

      // ─ Support / messaging ─────────────────────────────────────────────────
      totalThreads,
      totalMessages,
      recentMessages,

      // ─ CMS ─────────────────────────────────────────────────────────────────
      activeAnnouncements,
      archivedAnnouncements,
      activeContentBlocks,

      // ─ Platform users ──────────────────────────────────────────────────────
      totalCitizenUsers,
    ] = await Promise.all([
      // Properties
      this.prisma.property.count(),
      this.prisma.property.count({where: {status: 'verified'}}),
      this.prisma.property.count({where: {status: 'pending_verification'}}),
      this.prisma.property.count({where: {status: 'needs_changes'}}),
      this.prisma.property.count({where: {status: 'rejected'}}),
      this.prisma.property.count({where: {status: 'frozen'}}),
      this.prisma.property.count({where: {status: 'sold'}}),
      this.prisma.simulation.count(),
      this.prisma.property.count({where: {blockchainStatus: 'anchored'}}),
      this.prisma.property.findFirst({
        where: {anchoredAt: {not: null}},
        orderBy: {anchoredAt: 'desc'},
        select: {anchoredAt: true},
      }),
      this.prisma.simulation.aggregate({_sum: {totalAmount: true}}),

      // Investment opportunities
      this.prisma.investmentOpportunity.count({where: {status: 'draft'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'submitted'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'under_review'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'approved'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'published'}}),
      this.prisma.investmentOpportunity.count({where: {status: 'rejected'}}),
      this.prisma.investmentSimulation.count(),
      this.prisma.investmentSimulation.aggregate({_sum: {totalAmount: true}}),

      // Providers
      this.prisma.providerProfile.count(),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'unverified'}}),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'under_review'}}),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'verified'}}),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'rejected'}}),
      this.prisma.providerProfile.count({where: {providerVerificationStatus: 'suspended'}}),

      // Moderation
      this.prisma.moderationReport.count({where: {status: 'open'}}),
      this.prisma.moderationReport.count({where: {status: 'under_review'}}),
      this.prisma.moderationReport.count({where: {status: 'resolved'}}),
      this.prisma.moderationReport.count({where: {status: 'dismissed'}}),
      this.prisma.qualityFlag.count({where: {resolvedAt: null}}),

      // Support / messaging
      this.prisma.thread.count(),
      this.prisma.message.count(),
      this.prisma.message.count({where: {createdAt: {gte: sevenDaysAgo}}}),

      // CMS
      this.prisma.announcement.count({where: {status: 'active'}}),
      this.prisma.announcement.count({where: {status: 'archived'}}),
      this.prisma.contentBlock.count({where: {active: true}}),

      // Platform users
      this.prisma.user.count({where: {role: 'citizen'}}),
    ]);

    return {
      // ─ Properties ──────────────────────────────────────────────────────────
      totalProperties,
      verifiedProperties,
      pendingVerificationProperties,
      needsChangesProperties,
      rejectedProperties,
      frozenProperties,
      soldProperties,
      totalSimulations,
      totalAnchored: anchoredRecords,
      lastAnchoredAt: lastAnchoredRecord?.anchoredAt?.toISOString() ?? null,
      totalSimulationVolume: totalSimulationVolumeAgg._sum.totalAmount ?? 0,

      // ─ Investment pipeline ──────────────────────────────────────────────────
      investments: {
        draft: investDraft,
        submitted: investSubmitted,
        underReview: investUnderReview,
        approved: investApproved,
        published: investPublished,
        rejected: investRejected,
        totalSimulations: totalInvestmentSimulations,
        totalSimulationVolume: investSimVolumeAgg._sum.totalAmount ?? 0,
      },

      // ─ Provider verification ────────────────────────────────────────────────
      providers: {
        total: providersTotal,
        unverified: providersUnverified,
        underReview: providersUnderReview,
        verified: providersVerified,
        rejected: providersRejected,
        suspended: providersSuspended,
      },

      // ─ Moderation ──────────────────────────────────────────────────────────
      moderation: {
        reportsOpen,
        reportsUnderReview,
        reportsResolved,
        reportsDismissed,
        unresolvedQualityFlags,
      },

      // ─ Support / messaging ──────────────────────────────────────────────────
      support: {
        totalThreads,
        totalMessages,
        recentMessages,
      },

      // ─ CMS ─────────────────────────────────────────────────────────────────
      cms: {
        activeAnnouncements,
        archivedAnnouncements,
        activeContentBlocks,
      },

      // ─ Platform ─────────────────────────────────────────────────────────────
      totalCitizenUsers,
    };
  }
}
