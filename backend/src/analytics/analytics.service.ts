import {Injectable} from '@nestjs/common';
import {PrismaService} from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalProperties,
      verifiedProperties,
      pendingVerificationProperties,
      frozenProperties,
      soldProperties,
      totalSimulations,
      anchoredRecords,
      lastAnchoredRecord,
      totalSimulationVolume,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.property.count({where: {status: 'verified'}}),
      this.prisma.property.count({where: {status: 'pending_verification'}}),
      this.prisma.property.count({where: {status: 'frozen'}}),
      this.prisma.property.count({where: {status: 'sold'}}),
      this.prisma.simulation.count(),
      this.prisma.property.count({where: {blockchainStatus: 'anchored'}}),
      this.prisma.property.findFirst({
        where: {anchoredAt: {not: null}},
        orderBy: {anchoredAt: 'desc'},
        select: {anchoredAt: true},
      }),
      this.prisma.simulation.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalProperties,
      verifiedProperties,
      pendingVerificationProperties,
      frozenProperties,
      soldProperties,
      totalSimulations,
      totalAnchored: anchoredRecords,
      lastAnchoredAt: lastAnchoredRecord?.anchoredAt?.toISOString() ?? null,
      totalSimulationVolume: totalSimulationVolume._sum.totalAmount ?? 0,
    };
  }
}
