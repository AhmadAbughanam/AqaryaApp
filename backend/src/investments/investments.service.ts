import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {InvestmentOpportunity, Prisma, WalletTxType} from '@prisma/client';
import {AuditService} from '../audit/audit.service';
import {PrismaService} from '../common/prisma.service';
import {WalletService} from '../wallet/wallet.service';
import {GetOpportunitiesDto} from './dto/get-opportunities.dto';

const PLATFORM_FEE_RATE = 0.015;
const GOVERNMENT_FEE_RATE = 0.0075;
const EXIT_FEE_RATE = 0.01;
const DEFAULT_TARGET_IRR = 0.14;
const DEFAULT_CASH_YIELD = 0.075;
const DEFAULT_APPRECIATION_RATE = 0.06;
const DEFAULT_OCCUPANCY_RATE = 0.9;
const DEFAULT_MANAGEMENT_FEE_RATE = 0.0125;
const DEFAULT_TARGET_HOLD_YEARS = 5;
const DEFAULT_MINIMUM_SHARES = 25;

type ExitScenario = 'conservative' | 'base' | 'optimistic';

export interface InvestmentProjectProfile {
  assetClass: string;
  stage: string;
  sponsorName: string;
  riskBand: string;
  targetHoldYears: number;
  targetIrr: number;
  targetCashYield: number;
  appreciationRate: number;
  occupancyRate: number;
  managementFeeRate: number;
  minimumShares: number;
  fundingProgress: number;
  distributionFrequency: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletService: WalletService,
  ) {}

  async getPilotProperties(search?: string) {
    const properties = await this.prisma.property.findMany({
      where: {
        marketType: 'investment',
        status: 'verified',
        availableShares: {gt: 0},
        ...(search?.trim()
          ? {
              OR: [
                {title: {contains: search.trim(), mode: 'insensitive'}},
                {location: {contains: search.trim(), mode: 'insensitive'}},
              ],
            }
          : {}),
      },
      orderBy: {updatedAt: 'desc'},
    });

    return properties.map(property => {
      const projectProfile = this.getProjectProfile(property.verificationPayload);
      const pricePerShare =
        property.totalShares > 0
          ? Number((property.price / property.totalShares).toFixed(2))
          : 0;

      return {
        id: property.id,
        title: property.title,
        location: property.location,
        description: property.description,
        price: property.price,
        propertyValue: property.propertyValue,
        totalShares: property.totalShares,
        availableShares: property.availableShares,
        pricePerShare,
        marketType: property.marketType,
        verificationStatus: property.status,
        sponsorName: projectProfile.sponsorName,
        assetClass: projectProfile.assetClass,
        stage: projectProfile.stage,
        riskBand: projectProfile.riskBand,
        fundingProgress: projectProfile.fundingProgress,
        targetHoldYears: projectProfile.targetHoldYears,
        targetIrr: projectProfile.targetIrr,
        targetCashYield: projectProfile.targetCashYield,
        occupancyRate: projectProfile.occupancyRate,
        minimumShares: projectProfile.minimumShares,
        minimumInvestmentAmount: Number(
          (pricePerShare * projectProfile.minimumShares).toFixed(2),
        ),
        distributionFrequency: projectProfile.distributionFrequency,
      };
    });
  }

  async simulateInvestment(
    userId: string,
    propertyId: string,
    shares: number,
    holdingPeriodYears = DEFAULT_TARGET_HOLD_YEARS,
    exitScenario: ExitScenario = 'base',
    reinvestDistributions = false,
  ) {
    const property = await this.prisma.property.findUnique({where: {id: propertyId}});
    if (!property) {
      throw new NotFoundException('Property not found.');
    }
    if (property.status !== 'verified') {
      throw new BadRequestException(
        'Only verified properties can be used for simulation.',
      );
    }
    if (property.marketType !== 'investment') {
      throw new BadRequestException(
        'Sale listings cannot be used in the investment simulation flow.',
      );
    }
    const projectProfile = this.getProjectProfile(property.verificationPayload);
    if (shares < projectProfile.minimumShares) {
      throw new BadRequestException(
        `Minimum investment is ${projectProfile.minimumShares} shares for this project.`,
      );
    }
    if (shares > property.availableShares) {
      throw new BadRequestException('Shares exceed currently available shares.');
    }

    const pricePerShare =
      property.totalShares > 0 ? property.price / property.totalShares : 0;
    const subtotal = Number((pricePerShare * shares).toFixed(2));
    const platformFee = Number((subtotal * PLATFORM_FEE_RATE).toFixed(2));
    const governmentFee = Number((subtotal * GOVERNMENT_FEE_RATE).toFixed(2));
    const totalAmount = Number((subtotal + platformFee + governmentFee).toFixed(2));
    const adjustedCashYield = this.getAdjustedCashYield(projectProfile, exitScenario);
    const annualGrossIncome = Number((subtotal * adjustedCashYield).toFixed(2));
    const annualManagementFee = Number(
      (subtotal * projectProfile.managementFeeRate).toFixed(2),
    );
    const annualNetCashFlow = Number(
      (annualGrossIncome - annualManagementFee).toFixed(2),
    );
    const fiveYearNetCashFlow = Number((annualNetCashFlow * 5).toFixed(2));
    const appreciationRate = this.getAppreciationRate(projectProfile, exitScenario);
    const projectedExitValue = Number(
      (subtotal * Math.pow(1 + appreciationRate, holdingPeriodYears)).toFixed(2),
    );
    const exitFee = Number((projectedExitValue * EXIT_FEE_RATE).toFixed(2));
    const projectedNetExitProceeds = Number(
      (projectedExitValue - exitFee).toFixed(2),
    );
    const compoundedDistributions = reinvestDistributions
      ? Number(
          (
            annualNetCashFlow *
            ((Math.pow(1 + adjustedCashYield / 2, holdingPeriodYears * 2) - 1) /
              (adjustedCashYield / 2 || 1))
          ).toFixed(2),
        )
      : Number((annualNetCashFlow * holdingPeriodYears).toFixed(2));
    const projectedProfit = Number(
      (projectedNetExitProceeds + compoundedDistributions - totalAmount).toFixed(2),
    );
    const equityMultiple = Number(
      ((projectedNetExitProceeds + compoundedDistributions) / totalAmount).toFixed(2),
    );
    const expectedAnnualReturn = annualNetCashFlow;
    const expectedFiveYearReturn = Number(
      (fiveYearNetCashFlow + (subtotal * Math.pow(1 + appreciationRate, 5) - subtotal)).toFixed(
        2,
      ),
    );
    const ownershipPercentage = Number(
      ((shares / property.totalShares) * 100).toFixed(4),
    );

    const remainingShares = property.availableShares - shares;

    const simulation = await this.prisma.$transaction(async transaction => {
      await transaction.property.update({
        where: {id: property.id},
        data: {
          availableShares: remainingShares,
          status: remainingShares === 0 ? 'sold' : property.status,
        },
      });

      return transaction.simulation.create({
        data: {
          userId,
          propertyId,
          shares,
          pricePerShare: Number(pricePerShare.toFixed(2)),
          subtotal,
          platformFee,
          governmentFee,
          totalAmount,
          ownershipPercentage,
          expectedAnnualReturn,
          expectedFiveYearReturn,
          simulatedValue: subtotal,
        },
      });
    });

    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {role: true},
    });

    if (user) {
      await this.auditService.log({
        actorId: userId,
        actorRole: user.role,
        actionType: 'simulate',
        propertyId,
        metadata: {
          simulationId: simulation.id,
          shares,
          subtotal,
          totalAmount,
          holdingPeriodYears,
          exitScenario,
          reinvestDistributions,
        },
      });
    }

    return {
      simulationId: simulation.id,
      propertyId: simulation.propertyId,
      sharesOwned: simulation.shares,
      pricePerShare: simulation.pricePerShare,
      subtotal: simulation.subtotal,
      platformFee: simulation.platformFee,
      governmentFee: simulation.governmentFee,
      totalAmount: simulation.totalAmount,
      simulatedValue: simulation.simulatedValue,
      expectedAnnualReturn: simulation.expectedAnnualReturn,
      expectedFiveYearReturn: simulation.expectedFiveYearReturn,
      ownershipPercentage: simulation.ownershipPercentage,
      annualGrossIncome,
      annualManagementFee,
      annualNetCashFlow,
      exitFee,
      projectedExitValue,
      projectedNetExitProceeds,
      projectedProfit,
      equityMultiple,
      holdingPeriodYears,
      exitScenario,
      reinvestDistributions,
      targetIrr: projectProfile.targetIrr,
      targetCashYield: projectProfile.targetCashYield,
      distributionFrequency: projectProfile.distributionFrequency,
      sponsorName: projectProfile.sponsorName,
      riskBand: projectProfile.riskBand,
      createdAt: simulation.createdAt.toISOString(),
    };
  }

  async getPortfolio(userId: string) {
    const items = await this.prisma.simulation.findMany({
      where: {userId},
      include: {
        property: {
          select: {
            title: true,
            location: true,
            status: true,
            verificationPayload: true,
          },
        },
      },
      orderBy: {createdAt: 'desc'},
    });

    return items.map(item => ({
      projectProfile: this.getProjectProfile(item.property.verificationPayload),
      simulationId: item.id,
      propertyId: item.propertyId,
      propertyTitle: item.property.title,
      location: item.property.location,
      propertyStatus: item.property.status,
      sharesOwned: item.shares,
      pricePerShare: item.pricePerShare,
      subtotal: item.subtotal,
      platformFee: item.platformFee,
      governmentFee: item.governmentFee,
      totalAmount: item.totalAmount,
      simulatedValue: item.simulatedValue,
      expectedAnnualReturn: item.expectedAnnualReturn,
      expectedFiveYearReturn: item.expectedFiveYearReturn,
      ownershipPercentage: item.ownershipPercentage,
      annualIncomeEstimate: item.expectedAnnualReturn,
      projectedEquityMultiple: Number(
        ((item.expectedFiveYearReturn + item.subtotal) / item.totalAmount).toFixed(2),
      ),
      createdAt: item.createdAt.toISOString(),
    }));
  }

  // ─── Investment Opportunity methods ────────────────────────────────────────

  async getOpportunities(dto: GetOpportunitiesDto) {
    const where: Prisma.InvestmentOpportunityWhereInput = {
      status: 'published',
      ...(dto.assetClass ? {assetClass: {equals: dto.assetClass, mode: 'insensitive'}} : {}),
      ...(dto.riskBand ? {riskBand: {equals: dto.riskBand, mode: 'insensitive'}} : {}),
      ...(dto.search?.trim()
        ? {
            OR: [
              {title: {contains: dto.search.trim(), mode: 'insensitive'}},
              {location: {contains: dto.search.trim(), mode: 'insensitive'}},
              {sponsorName: {contains: dto.search.trim(), mode: 'insensitive'}},
            ],
          }
        : {}),
    };

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.investmentOpportunity.findMany({
        where,
        orderBy: [{publishedAt: 'desc'}, {trustScore: 'desc'}],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.investmentOpportunity.count({where}),
    ]);

    return {
      items: items.map(opp => this.mapOpportunityListItem(opp)),
      total,
      page,
      limit,
    };
  }

  async getOpportunityDetail(id: string) {
    const opp = await this.prisma.investmentOpportunity.findUnique({where: {id}});
    if (!opp) {
      throw new NotFoundException('Investment opportunity not found.');
    }
    if (opp.status !== 'published') {
      throw new NotFoundException('Investment opportunity not found.');
    }

    const fundingGoal = opp.totalShares * opp.pricePerShare;
    const fundedAmount = (opp.totalShares - opp.availableShares) * opp.pricePerShare;

    return {
      ...this.mapOpportunityListItem(opp),
      description: opp.description,
      imageUrls: this.parseJsonStringArray(opp.imageUrls),
      ownershipStructure: opp.ownershipStructure,
      distributionModel: opp.distributionModel,
      exitModel: opp.exitModel,
      totalShares: opp.totalShares,
      availableShares: opp.availableShares,
      pricePerShare: opp.pricePerShare,
      minimumShares: opp.minimumShares,
      minimumInvestmentAmount: Number((opp.pricePerShare * opp.minimumShares).toFixed(2)),
      fundingGoal: Number(fundingGoal.toFixed(2)),
      fundedAmount: Number(fundedAmount.toFixed(2)),
      appreciationRate: opp.appreciationRate,
      occupancyRate: opp.occupancyRate,
      managementFeeRate: opp.managementFeeRate,
      publishedAt: opp.publishedAt?.toISOString() ?? null,
      verificationRecordId: opp.verificationRecordId,
      blockchainHash: opp.blockchainHash,
      blockchainTxId: opp.blockchainTxId,
      blockchainStatus: opp.blockchainStatus,
      anchoredAt: opp.anchoredAt?.toISOString() ?? null,
    };
  }

  async simulateOpportunityInvestment(
    userId: string,
    opportunityId: string,
    shares: number,
    holdingPeriodYears = DEFAULT_TARGET_HOLD_YEARS,
    exitScenario: ExitScenario = 'base',
    reinvestDistributions = false,
  ) {
    const opp = await this.prisma.investmentOpportunity.findUnique({where: {id: opportunityId}});
    if (!opp) {
      throw new NotFoundException('Investment opportunity not found.');
    }
    if (opp.status !== 'published') {
      throw new BadRequestException('Only published opportunities are open for investment simulation.');
    }
    if (shares < opp.minimumShares) {
      throw new BadRequestException(`Minimum investment is ${opp.minimumShares} shares for this opportunity.`);
    }
    if (shares > opp.availableShares) {
      throw new BadRequestException('Shares exceed currently available shares.');
    }

    const profile: InvestmentProjectProfile = {
      assetClass: opp.assetClass,
      stage: opp.stage,
      sponsorName: opp.sponsorName,
      riskBand: opp.riskBand,
      targetHoldYears: opp.targetHoldYears,
      targetIrr: opp.targetIrr,
      targetCashYield: opp.targetCashYield,
      appreciationRate: opp.appreciationRate,
      occupancyRate: opp.occupancyRate,
      managementFeeRate: opp.managementFeeRate,
      minimumShares: opp.minimumShares,
      fundingProgress: opp.totalShares > 0
        ? (opp.totalShares - opp.availableShares) / opp.totalShares
        : 0,
      distributionFrequency: opp.distributionModel,
    };

    const pricePerShare = opp.pricePerShare;
    const subtotal = Number((pricePerShare * shares).toFixed(2));
    const platformFee = Number((subtotal * PLATFORM_FEE_RATE).toFixed(2));
    const governmentFee = Number((subtotal * GOVERNMENT_FEE_RATE).toFixed(2));
    const totalAmount = Number((subtotal + platformFee + governmentFee).toFixed(2));
    const adjustedCashYield = this.getAdjustedCashYield(profile, exitScenario);
    const annualGrossIncome = Number((subtotal * adjustedCashYield).toFixed(2));
    const annualManagementFee = Number((subtotal * profile.managementFeeRate).toFixed(2));
    const annualNetCashFlow = Number((annualGrossIncome - annualManagementFee).toFixed(2));
    const appreciationRate = this.getAppreciationRate(profile, exitScenario);
    const projectedExitValue = Number(
      (subtotal * Math.pow(1 + appreciationRate, holdingPeriodYears)).toFixed(2),
    );
    const exitFee = Number((projectedExitValue * EXIT_FEE_RATE).toFixed(2));
    const projectedNetExitProceeds = Number((projectedExitValue - exitFee).toFixed(2));
    const compoundedDistributions = reinvestDistributions
      ? Number(
          (
            annualNetCashFlow *
            ((Math.pow(1 + adjustedCashYield / 2, holdingPeriodYears * 2) - 1) /
              (adjustedCashYield / 2 || 1))
          ).toFixed(2),
        )
      : Number((annualNetCashFlow * holdingPeriodYears).toFixed(2));
    const projectedProfit = Number(
      (projectedNetExitProceeds + compoundedDistributions - totalAmount).toFixed(2),
    );
    const equityMultiple = Number(
      ((projectedNetExitProceeds + compoundedDistributions) / totalAmount).toFixed(2),
    );
    const expectedAnnualReturn = annualNetCashFlow;
    const expectedFiveYearReturn = Number(
      (
        annualNetCashFlow * 5 +
        (subtotal * Math.pow(1 + appreciationRate, 5) - subtotal)
      ).toFixed(2),
    );
    const ownershipPercentage = Number(
      ((shares / opp.totalShares) * 100).toFixed(4),
    );

    const remainingShares = opp.availableShares - shares;

    const simulation = await this.prisma.$transaction(async tx => {
      await tx.investmentOpportunity.update({
        where: {id: opp.id},
        data: {availableShares: remainingShares},
      });

      return tx.investmentSimulation.create({
        data: {
          userId,
          opportunityId,
          shares,
          pricePerShare,
          subtotal,
          platformFee,
          governmentFee,
          totalAmount,
          ownershipPercentage,
          expectedAnnualReturn,
          expectedFiveYearReturn,
          simulatedValue: subtotal,
          holdingPeriodYears,
          exitScenario,
          reinvestDistributions,
          annualGrossIncome,
          annualManagementFee,
          annualNetCashFlow,
          exitFee,
          projectedExitValue,
          projectedNetExitProceeds,
          projectedProfit,
          equityMultiple,
        },
      });
    });

    const user = await this.prisma.user.findUnique({where: {id: userId}, select: {role: true}});
    if (user) {
      await this.auditService.log({
        actorId: userId,
        actorRole: user.role,
        actionType: 'opportunity_simulate',
        metadata: {
          opportunityId,
          simulationId: simulation.id,
          shares,
          subtotal,
          totalAmount,
          holdingPeriodYears,
          exitScenario,
          reinvestDistributions,
        },
      });
    }

    return {
      simulationId: simulation.id,
      opportunityId: simulation.opportunityId,
      sharesOwned: simulation.shares,
      pricePerShare: simulation.pricePerShare,
      subtotal: simulation.subtotal,
      platformFee: simulation.platformFee,
      governmentFee: simulation.governmentFee,
      totalAmount: simulation.totalAmount,
      simulatedValue: simulation.simulatedValue,
      expectedAnnualReturn: simulation.expectedAnnualReturn,
      expectedFiveYearReturn: simulation.expectedFiveYearReturn,
      ownershipPercentage: simulation.ownershipPercentage,
      annualGrossIncome,
      annualManagementFee,
      annualNetCashFlow,
      exitFee,
      projectedExitValue,
      projectedNetExitProceeds,
      projectedProfit,
      equityMultiple,
      holdingPeriodYears,
      exitScenario,
      reinvestDistributions,
      targetIrr: profile.targetIrr,
      targetCashYield: profile.targetCashYield,
      distributionFrequency: profile.distributionFrequency,
      sponsorName: profile.sponsorName,
      riskBand: profile.riskBand,
      opportunityTitle: opp.title,
      assetClass: opp.assetClass,
      trustScore: opp.trustScore,
      trustBadge: opp.trustBadge,
      createdAt: simulation.createdAt.toISOString(),
    };
  }

  async investOpportunityWithWallet(
    userId: string,
    opportunityId: string,
    shares: number,
    holdingPeriodYears = DEFAULT_TARGET_HOLD_YEARS,
    exitScenario: ExitScenario = 'base',
    reinvestDistributions = false,
  ) {
    const opp = await this.prisma.investmentOpportunity.findUnique({where: {id: opportunityId}});
    if (!opp) throw new NotFoundException('Investment opportunity not found.');
    if (opp.status !== 'published') {
      throw new BadRequestException('Only published opportunities are open for investment.');
    }
    if (shares < opp.minimumShares) {
      throw new BadRequestException(`Minimum investment is ${opp.minimumShares} shares.`);
    }
    if (shares > opp.availableShares) {
      throw new BadRequestException('Shares exceed currently available shares.');
    }

    const pricePerShare = opp.pricePerShare;
    const subtotal = Number((pricePerShare * shares).toFixed(2));
    const platformFee = Number((subtotal * PLATFORM_FEE_RATE).toFixed(2));
    const governmentFee = Number((subtotal * GOVERNMENT_FEE_RATE).toFixed(2));
    const totalAmount = Number((subtotal + platformFee + governmentFee).toFixed(2));

    const profile: InvestmentProjectProfile = {
      assetClass: opp.assetClass,
      stage: opp.stage,
      sponsorName: opp.sponsorName,
      riskBand: opp.riskBand,
      targetHoldYears: opp.targetHoldYears,
      targetIrr: opp.targetIrr,
      targetCashYield: opp.targetCashYield,
      appreciationRate: opp.appreciationRate,
      occupancyRate: opp.occupancyRate,
      managementFeeRate: opp.managementFeeRate,
      minimumShares: opp.minimumShares,
      fundingProgress: opp.totalShares > 0
        ? (opp.totalShares - opp.availableShares) / opp.totalShares
        : 0,
      distributionFrequency: opp.distributionModel,
    };

    const adjustedCashYield = this.getAdjustedCashYield(profile, exitScenario);
    const annualGrossIncome = Number((subtotal * adjustedCashYield).toFixed(2));
    const annualManagementFee = Number((subtotal * profile.managementFeeRate).toFixed(2));
    const annualNetCashFlow = Number((annualGrossIncome - annualManagementFee).toFixed(2));
    const appreciationRate = this.getAppreciationRate(profile, exitScenario);
    const projectedExitValue = Number(
      (subtotal * Math.pow(1 + appreciationRate, holdingPeriodYears)).toFixed(2),
    );
    const exitFee = Number((projectedExitValue * EXIT_FEE_RATE).toFixed(2));
    const projectedNetExitProceeds = Number((projectedExitValue - exitFee).toFixed(2));
    const compoundedDistributions = reinvestDistributions
      ? Number(
          (annualNetCashFlow * ((Math.pow(1 + adjustedCashYield / 2, holdingPeriodYears * 2) - 1) / (adjustedCashYield / 2 || 1))).toFixed(2),
        )
      : Number((annualNetCashFlow * holdingPeriodYears).toFixed(2));
    const projectedProfit = Number((projectedNetExitProceeds + compoundedDistributions - totalAmount).toFixed(2));
    const equityMultiple = Number(((projectedNetExitProceeds + compoundedDistributions) / totalAmount).toFixed(2));
    const expectedAnnualReturn = annualNetCashFlow;
    const expectedFiveYearReturn = Number(
      (annualNetCashFlow * 5 + (subtotal * Math.pow(1 + appreciationRate, 5) - subtotal)).toFixed(2),
    );
    const ownershipPercentage = Number(((shares / opp.totalShares) * 100).toFixed(4));
    const remainingShares = opp.availableShares - shares;

    const simulation = await this.prisma.$transaction(async tx => {
      await this.walletService.debitInTransaction(
        tx,
        userId,
        totalAmount,
        WalletTxType.investment,
        `Investment: ${opp.title} (${shares} shares)`,
        opp.title,
      );

      await tx.investmentOpportunity.update({
        where: {id: opp.id},
        data: {availableShares: remainingShares},
      });

      return tx.investmentSimulation.create({
        data: {
          userId,
          opportunityId,
          shares,
          pricePerShare,
          subtotal,
          platformFee,
          governmentFee,
          totalAmount,
          ownershipPercentage,
          expectedAnnualReturn,
          expectedFiveYearReturn,
          simulatedValue: subtotal,
          holdingPeriodYears,
          exitScenario,
          reinvestDistributions,
          annualGrossIncome,
          annualManagementFee,
          annualNetCashFlow,
          exitFee,
          projectedExitValue,
          projectedNetExitProceeds,
          projectedProfit,
          equityMultiple,
        },
      });
    });

    const user = await this.prisma.user.findUnique({where: {id: userId}, select: {role: true}});
    if (user) {
      await this.auditService.log({
        actorId: userId,
        actorRole: user.role,
        actionType: 'opportunity_simulate',
        metadata: {
          opportunityId,
          simulationId: simulation.id,
          shares,
          totalAmount,
          paymentMethod: 'ejod_wallet',
        },
      });
    }

    return {
      simulationId: simulation.id,
      opportunityId: simulation.opportunityId,
      sharesOwned: simulation.shares,
      pricePerShare: simulation.pricePerShare,
      subtotal: simulation.subtotal,
      platformFee: simulation.platformFee,
      governmentFee: simulation.governmentFee,
      totalAmount: simulation.totalAmount,
      simulatedValue: simulation.simulatedValue,
      expectedAnnualReturn: simulation.expectedAnnualReturn,
      expectedFiveYearReturn: simulation.expectedFiveYearReturn,
      ownershipPercentage: simulation.ownershipPercentage,
      annualGrossIncome,
      annualManagementFee,
      annualNetCashFlow,
      exitFee,
      projectedExitValue,
      projectedNetExitProceeds,
      projectedProfit,
      equityMultiple,
      holdingPeriodYears,
      exitScenario,
      reinvestDistributions,
      targetIrr: profile.targetIrr,
      targetCashYield: profile.targetCashYield,
      distributionFrequency: profile.distributionFrequency,
      sponsorName: profile.sponsorName,
      riskBand: profile.riskBand,
      opportunityTitle: opp.title,
      assetClass: opp.assetClass,
      trustScore: opp.trustScore,
      trustBadge: opp.trustBadge,
      createdAt: simulation.createdAt.toISOString(),
      message: 'Investment placed successfully with Ejod Wallet.',
    };
  }

  async getOpportunityPortfolio(userId: string) {
    const items = await this.prisma.investmentSimulation.findMany({
      where: {userId},
      include: {
        opportunity: {
          select: {
            title: true,
            location: true,
            status: true,
            assetClass: true,
            stage: true,
            sponsorName: true,
            riskBand: true,
            targetHoldYears: true,
            targetIrr: true,
            targetCashYield: true,
            appreciationRate: true,
            occupancyRate: true,
            managementFeeRate: true,
            totalShares: true,
            availableShares: true,
            distributionModel: true,
            trustScore: true,
            trustBadge: true,
          },
        },
      },
      orderBy: {createdAt: 'desc'},
    });

    return items.map(item => ({
      simulationId: item.id,
      opportunityId: item.opportunityId,
      opportunityTitle: item.opportunity.title,
      location: item.opportunity.location,
      opportunityStatus: item.opportunity.status,
      assetClass: item.opportunity.assetClass,
      stage: item.opportunity.stage,
      sponsorName: item.opportunity.sponsorName,
      riskBand: item.opportunity.riskBand,
      targetHoldYears: item.opportunity.targetHoldYears,
      targetIrr: item.opportunity.targetIrr,
      targetCashYield: item.opportunity.targetCashYield,
      distributionFrequency: item.opportunity.distributionModel,
      trustScore: item.opportunity.trustScore,
      trustBadge: item.opportunity.trustBadge,
      sharesOwned: item.shares,
      pricePerShare: item.pricePerShare,
      subtotal: item.subtotal,
      platformFee: item.platformFee,
      governmentFee: item.governmentFee,
      totalAmount: item.totalAmount,
      simulatedValue: item.simulatedValue,
      expectedAnnualReturn: item.expectedAnnualReturn,
      expectedFiveYearReturn: item.expectedFiveYearReturn,
      ownershipPercentage: item.ownershipPercentage,
      annualGrossIncome: item.annualGrossIncome,
      annualNetCashFlow: item.annualNetCashFlow,
      projectedProfit: item.projectedProfit,
      equityMultiple: item.equityMultiple,
      holdingPeriodYears: item.holdingPeriodYears,
      exitScenario: item.exitScenario,
      annualIncomeEstimate: item.expectedAnnualReturn,
      projectedEquityMultiple: Number(
        ((item.expectedFiveYearReturn + item.subtotal) / item.totalAmount).toFixed(2),
      ),
      createdAt: item.createdAt.toISOString(),
    }));
  }

  // ─── Map helpers ────────────────────────────────────────────────────────────

  private mapOpportunityListItem(opp: InvestmentOpportunity) {
    const fundingGoal = opp.totalShares * opp.pricePerShare;
    const fundedAmount = (opp.totalShares - opp.availableShares) * opp.pricePerShare;
    const fundingProgress = opp.totalShares > 0
      ? (opp.totalShares - opp.availableShares) / opp.totalShares
      : 0;

    return {
      id: opp.id,
      title: opp.title,
      location: opp.location,
      assetClass: opp.assetClass,
      stage: opp.stage,
      sponsorName: opp.sponsorName,
      riskBand: opp.riskBand,
      targetIrr: opp.targetIrr,
      targetCashYield: opp.targetCashYield,
      targetHoldYears: opp.targetHoldYears,
      pricePerShare: opp.pricePerShare,
      minimumShares: opp.minimumShares,
      minimumInvestmentAmount: Number((opp.pricePerShare * opp.minimumShares).toFixed(2)),
      fundingGoal: Number(fundingGoal.toFixed(2)),
      fundedAmount: Number(fundedAmount.toFixed(2)),
      fundingProgress: Number(fundingProgress.toFixed(4)),
      trustScore: opp.trustScore,
      trustBadge: opp.trustBadge,
      status: opp.status,
      publishedAt: opp.publishedAt?.toISOString() ?? null,
      createdAt: opp.createdAt.toISOString(),
    };
  }

  private parseJsonStringArray(value: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }

  // ─── Legacy Property-based helpers ─────────────────────────────────────────

  private getProjectProfile(payload: Prisma.JsonValue | null): InvestmentProjectProfile {
    const projectProfile = isObject(payload) && isObject(payload.investmentProfile)
      ? (payload.investmentProfile as Record<string, unknown>)
      : {};

    return {
      assetClass: this.readString(projectProfile.assetClass, 'Mixed use'),
      stage: this.readString(projectProfile.stage, 'Operational'),
      sponsorName: this.readString(projectProfile.sponsorName, 'Aqarya Sponsor Desk'),
      riskBand: this.readString(projectProfile.riskBand, 'Balanced'),
      targetHoldYears: this.readNumber(
        projectProfile.targetHoldYears,
        DEFAULT_TARGET_HOLD_YEARS,
      ),
      targetIrr: this.readNumber(projectProfile.targetIrr, DEFAULT_TARGET_IRR),
      targetCashYield: this.readNumber(
        projectProfile.targetCashYield,
        DEFAULT_CASH_YIELD,
      ),
      appreciationRate: this.readNumber(
        projectProfile.appreciationRate,
        DEFAULT_APPRECIATION_RATE,
      ),
      occupancyRate: this.readNumber(
        projectProfile.occupancyRate,
        DEFAULT_OCCUPANCY_RATE,
      ),
      managementFeeRate: this.readNumber(
        projectProfile.managementFeeRate,
        DEFAULT_MANAGEMENT_FEE_RATE,
      ),
      minimumShares: Math.max(
        1,
        Math.round(this.readNumber(projectProfile.minimumShares, DEFAULT_MINIMUM_SHARES)),
      ),
      fundingProgress: this.readNumber(projectProfile.fundingProgress, 0.55),
      distributionFrequency: this.readString(
        projectProfile.distributionFrequency,
        'Quarterly',
      ),
    };
  }

  private getAdjustedCashYield(
    profile: InvestmentProjectProfile,
    exitScenario: ExitScenario,
  ) {
    const scenarioFactor =
      exitScenario === 'optimistic' ? 1.08 : exitScenario === 'conservative' ? 0.88 : 1;

    return Number(
      (profile.targetCashYield * profile.occupancyRate * scenarioFactor).toFixed(4),
    );
  }

  private getAppreciationRate(
    profile: InvestmentProjectProfile,
    exitScenario: ExitScenario,
  ) {
    const scenarioFactor =
      exitScenario === 'optimistic' ? 1.15 : exitScenario === 'conservative' ? 0.8 : 1;

    return Number((profile.appreciationRate * scenarioFactor).toFixed(4));
  }

  private readString(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private readNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }
}
