import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {Prisma, User} from '@prisma/client';
import {PrismaService} from '../common/prisma.service';
import {SaveItemDto} from './dto/save-item.dto';
import {UpdatePreferencesDto} from './dto/update-preferences.dto';
import {CreateSavedSearchDto} from './dto/create-saved-search.dto';

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
        preference: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const savedCount = await this.prisma.savedItem.count({where: {userId}});

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
        savedCount,
        totalOwnedValue,
        totalInvested,
      },
      preference: user.preference
        ? {
            notificationsEnabled: user.preference.notificationsEnabled,
            language: user.preference.language,
          }
        : {notificationsEnabled: true, language: 'en'},
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
        imageUrls: Array.isArray(property.imageUrls)
          ? (property.imageUrls as string[]).filter((u): u is string => typeof u === 'string')
          : [],
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

  // ─── Saved Items ─────────────────────────────────────────────────────────────

  async saveItem(userId: string, dto: SaveItemDto) {
    if (dto.type === 'listing') {
      if (!dto.propertyId) {
        throw new BadRequestException('propertyId is required when saving a listing.');
      }
      const listing = await this.prisma.property.findUnique({where: {id: dto.propertyId}});
      if (!listing) {
        throw new NotFoundException('Listing not found.');
      }
      const existing = await this.prisma.savedItem.findFirst({
        where: {userId, propertyId: dto.propertyId},
      });
      if (existing) {
        return this.mapSavedItem(existing);
      }
      const saved = await this.prisma.savedItem.create({
        data: {userId, type: 'listing', propertyId: dto.propertyId},
      });
      return this.mapSavedItem(saved);
    }

    // opportunity
    if (!dto.opportunityId) {
      throw new BadRequestException('opportunityId is required when saving an opportunity.');
    }
    const opp = await this.prisma.investmentOpportunity.findUnique({where: {id: dto.opportunityId}});
    if (!opp || opp.status !== 'published') {
      throw new NotFoundException('Opportunity not found or not published.');
    }
    const existing = await this.prisma.savedItem.findFirst({
      where: {userId, opportunityId: dto.opportunityId},
    });
    if (existing) {
      return this.mapSavedItem(existing);
    }
    const saved = await this.prisma.savedItem.create({
      data: {userId, type: 'opportunity', opportunityId: dto.opportunityId},
    });
    return this.mapSavedItem(saved);
  }

  async unsaveListing(userId: string, propertyId: string) {
    const item = await this.prisma.savedItem.findFirst({
      where: {userId, propertyId},
    });
    if (!item) {
      throw new NotFoundException('Saved listing not found.');
    }
    await this.prisma.savedItem.delete({where: {id: item.id}});
  }

  async unsaveOpportunity(userId: string, opportunityId: string) {
    const item = await this.prisma.savedItem.findFirst({
      where: {userId, opportunityId},
    });
    if (!item) {
      throw new NotFoundException('Saved opportunity not found.');
    }
    await this.prisma.savedItem.delete({where: {id: item.id}});
  }

  async getSavedItems(userId: string) {
    const items = await this.prisma.savedItem.findMany({
      where: {userId},
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            marketType: true,
            status: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            location: true,
            pricePerShare: true,
            assetClass: true,
            riskBand: true,
            trustBadge: true,
            status: true,
          },
        },
      },
      orderBy: {savedAt: 'desc'},
    });

    return items.map(item => ({
      id: item.id,
      type: item.type,
      savedAt: item.savedAt.toISOString(),
      listing: item.property
        ? {
            id: item.property.id,
            title: item.property.title,
            location: item.property.location,
            price: item.property.price,
            marketType: item.property.marketType,
            status: item.property.status,
          }
        : null,
      opportunity: item.opportunity
        ? {
            id: item.opportunity.id,
            title: item.opportunity.title,
            location: item.opportunity.location,
            pricePerShare: item.opportunity.pricePerShare,
            assetClass: item.opportunity.assetClass,
            riskBand: item.opportunity.riskBand,
            trustBadge: item.opportunity.trustBadge,
            status: item.opportunity.status,
          }
        : null,
    }));
  }

  async isSavedListing(userId: string, propertyId: string): Promise<boolean> {
    const item = await this.prisma.savedItem.findFirst({where: {userId, propertyId}});
    return item != null;
  }

  async isSavedOpportunity(userId: string, opportunityId: string): Promise<boolean> {
    const item = await this.prisma.savedItem.findFirst({where: {userId, opportunityId}});
    return item != null;
  }

  // ─── Preferences ─────────────────────────────────────────────────────────────

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const preference = await this.prisma.userPreference.upsert({
      where: {userId},
      update: {
        ...(dto.notificationsEnabled !== undefined
          ? {notificationsEnabled: dto.notificationsEnabled}
          : {}),
        ...(dto.language !== undefined ? {language: dto.language} : {}),
      },
      create: {
        userId,
        notificationsEnabled: dto.notificationsEnabled ?? true,
        language: dto.language ?? 'en',
      },
    });

    return {
      notificationsEnabled: preference.notificationsEnabled,
      language: preference.language,
    };
  }

  // ─── Saved Searches ───────────────────────────────────────────────────────────

  async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    const search = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        searchType: dto.searchType,
        filters: dto.filters as Prisma.InputJsonValue,
      },
    });
    return this.mapSavedSearch(search);
  }

  async getSavedSearches(userId: string) {
    const searches = await this.prisma.savedSearch.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
    });
    return searches.map(s => this.mapSavedSearch(s));
  }

  async deleteSavedSearch(userId: string, id: string) {
    const search = await this.prisma.savedSearch.findUnique({where: {id}});
    if (!search || search.userId !== userId) {
      throw new NotFoundException('Saved search not found.');
    }
    await this.prisma.savedSearch.delete({where: {id}});
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {userId},
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data as Record<string, unknown> | null,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({where: {id}});
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found.');
    }
    await this.prisma.notification.update({
      where: {id},
      data: {isRead: true},
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private mapSavedItem(item: {id: string; type: string; propertyId: string | null; opportunityId: string | null; savedAt: Date}) {
    return {
      id: item.id,
      type: item.type,
      propertyId: item.propertyId,
      opportunityId: item.opportunityId,
      savedAt: item.savedAt.toISOString(),
    };
  }

  private mapSavedSearch(search: {id: string; name: string; searchType: string; filters: unknown; createdAt: Date}) {
    return {
      id: search.id,
      name: search.name,
      searchType: search.searchType,
      filters: search.filters as Record<string, unknown>,
      createdAt: search.createdAt.toISOString(),
    };
  }
}
