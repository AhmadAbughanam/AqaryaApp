import {Injectable} from '@nestjs/common';
import {FlagSeverity, InvestmentOpportunity, Property, ReportTargetType} from '@prisma/client';
import {PrismaService} from '../common/prisma.service';

interface FlagInput {
  rule: string;
  severity: FlagSeverity;
  details: string;
}

@Injectable()
export class QualityFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async computeAndPersistForListing(propertyId: string): Promise<void> {
    const property = await this.prisma.property.findUnique({where: {id: propertyId}});
    if (!property) return;

    const flags = this.computeListingFlags(property);
    await this.upsertFlags('listing', propertyId, flags);
  }

  async computeAndPersistForOpportunity(opportunityId: string): Promise<void> {
    const opp = await this.prisma.investmentOpportunity.findUnique({
      where: {id: opportunityId},
    });
    if (!opp) return;

    const flags = this.computeOpportunityFlags(opp);
    await this.upsertFlags('opportunity', opportunityId, flags);
  }

  async getFlagsForTarget(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    return this.prisma.qualityFlag.findMany({
      where: {targetType, targetId, resolvedAt: null},
      orderBy: [{severity: 'desc'}, {createdAt: 'asc'}],
    });
  }

  async getOpenFlagCount(): Promise<number> {
    return this.prisma.qualityFlag.count({where: {resolvedAt: null}});
  }

  private computeListingFlags(property: Property): FlagInput[] {
    const flags: FlagInput[] = [];

    // Suspicious pricing anomaly
    if (property.price > 0 && property.propertyValue > 0) {
      const ratio = property.price / property.propertyValue;
      if (ratio > 3.0 || ratio < 0.2) {
        flags.push({
          rule: 'suspicious_pricing',
          severity: 'high',
          details: `Price (${property.price}) is ${ratio.toFixed(2)}x the property value (${property.propertyValue}). Extreme deviation.`,
        });
      } else if (ratio > 2.0 || ratio < 0.4) {
        flags.push({
          rule: 'suspicious_pricing',
          severity: 'medium',
          details: `Price (${property.price}) is ${ratio.toFixed(2)}x the property value (${property.propertyValue}).`,
        });
      }
    }

    // Missing or incomplete key data
    const missingFields: string[] = [];
    if (!property.description || property.description.trim().length < 20) {
      missingFields.push('description');
    }
    if (!property.location || property.location.trim().length < 3) {
      missingFields.push('location');
    }
    if (!property.ownerName || property.ownerName.trim().length < 2) {
      missingFields.push('owner name');
    }
    if (missingFields.length > 0) {
      flags.push({
        rule: 'missing_key_data',
        severity: missingFields.length >= 2 ? 'medium' : 'low',
        details: `Missing or incomplete: ${missingFields.join(', ')}.`,
      });
    }

    return flags;
  }

  private computeOpportunityFlags(opp: InvestmentOpportunity): FlagInput[] {
    const flags: FlagInput[] = [];

    // Unrealistic IRR
    if (opp.targetIrr > 0.5) {
      flags.push({
        rule: 'unrealistic_returns',
        severity: 'high',
        details: `Target IRR of ${(opp.targetIrr * 100).toFixed(1)}% exceeds 50% — extreme outlier.`,
      });
    } else if (opp.targetIrr > 0.35) {
      flags.push({
        rule: 'unrealistic_returns',
        severity: 'medium',
        details: `Target IRR of ${(opp.targetIrr * 100).toFixed(1)}% exceeds 35%.`,
      });
    }

    // Unrealistic cash yield
    if (opp.targetCashYield > 0.35) {
      flags.push({
        rule: 'unrealistic_cash_yield',
        severity: 'high',
        details: `Target cash yield of ${(opp.targetCashYield * 100).toFixed(1)}% exceeds 35%.`,
      });
    } else if (opp.targetCashYield > 0.25) {
      flags.push({
        rule: 'unrealistic_cash_yield',
        severity: 'medium',
        details: `Target cash yield of ${(opp.targetCashYield * 100).toFixed(1)}% exceeds 25%.`,
      });
    }

    // Missing key data
    const missingFields: string[] = [];
    if (!opp.description || opp.description.trim().length < 20) {
      missingFields.push('description');
    }
    if (!opp.sponsorName || opp.sponsorName.trim().length < 3) {
      missingFields.push('sponsor name');
    }
    if (!opp.location || opp.location.trim().length < 3) {
      missingFields.push('location');
    }
    if (missingFields.length > 0) {
      flags.push({
        rule: 'missing_key_data',
        severity: missingFields.length >= 2 ? 'medium' : 'low',
        details: `Missing or incomplete: ${missingFields.join(', ')}.`,
      });
    }

    return flags;
  }

  private async upsertFlags(
    targetType: ReportTargetType,
    targetId: string,
    computed: FlagInput[],
  ): Promise<void> {
    // Delete old unresolved flags for this target and re-insert fresh ones.
    // This keeps them deterministic and in sync with current entity state.
    await this.prisma.qualityFlag.deleteMany({
      where: {targetType, targetId, resolvedAt: null},
    });

    if (computed.length === 0) return;

    await this.prisma.qualityFlag.createMany({
      data: computed.map(f => ({
        targetType,
        targetId,
        rule: f.rule,
        severity: f.severity,
        details: f.details,
      })),
    });
  }
}
