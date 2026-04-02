import {Injectable, NotFoundException} from '@nestjs/common';
import {User} from '@prisma/client';
import {PrismaService} from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({where: {username}});
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({where: {id}});
  }

  async getCitizenProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      include: {
        ownedProperties: {
          orderBy: {createdAt: 'desc'},
        },
        simulations: {
          orderBy: {createdAt: 'desc'},
          include: {
            property: {
              select: {
                id: true,
                title: true,
                location: true,
                status: true,
                marketType: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const totalOwnedValue = user.ownedProperties.reduce(
      (sum, property) => sum + property.propertyValue,
      0,
    );
    const totalInvested = user.simulations.reduce(
      (sum, simulation) => sum + simulation.totalAmount,
      0,
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      aggregates: {
        ownedPropertyCount: user.ownedProperties.length,
        salePropertyCount: user.ownedProperties.filter(property => property.marketType === 'sale')
          .length,
        investmentProjectCount: user.ownedProperties.filter(
          property => property.marketType === 'investment',
        ).length,
        listedForSaleCount: user.ownedProperties.filter(
          property =>
            property.marketType === 'sale' &&
            ['pending_verification', 'verified', 'frozen'].includes(property.status),
        ).length,
        soldPropertyCount: user.ownedProperties.filter(property => property.status === 'sold')
          .length,
        investmentCount: user.simulations.length,
        totalOwnedValue,
        totalInvested,
      },
      ownedProperties: user.ownedProperties.map(property => ({
        id: property.id,
        title: property.title,
        location: property.location,
        status: property.status,
        marketType: property.marketType,
        propertyValue: property.propertyValue,
        price: property.price,
        availableShares: property.availableShares,
        totalShares: property.totalShares,
        verificationStatus: property.propertyVerificationStatus,
        identityVerificationStatus: property.identityVerificationStatus,
        canListForSale:
          property.marketType === 'sale' &&
          !['pending_verification', 'verified', 'frozen'].includes(property.status),
        createdAt: property.createdAt.toISOString(),
        updatedAt: property.updatedAt.toISOString(),
      })),
      investments: user.simulations.map(simulation => ({
        simulationId: simulation.id,
        propertyId: simulation.propertyId,
        propertyTitle: simulation.property.title,
        propertyLocation: simulation.property.location,
        propertyStatus: simulation.property.status,
        propertyMarketType: simulation.property.marketType,
        sharesOwned: simulation.shares,
        totalAmount: simulation.totalAmount,
        expectedAnnualReturn: simulation.expectedAnnualReturn,
        expectedFiveYearReturn: simulation.expectedFiveYearReturn,
        createdAt: simulation.createdAt.toISOString(),
      })),
    };
  }
}
