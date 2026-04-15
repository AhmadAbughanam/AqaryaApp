import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {Property, Prisma, UserRole, WalletTxType} from '@prisma/client';
import {AuditService} from '../audit/audit.service';
import {PrismaService} from '../common/prisma.service';
import {VerificationService} from '../verification/verification.service';
import {WalletService} from '../wallet/wallet.service';
import {CreateSaleListingDto} from './dto/create-sale-listing.dto';

interface ListingFilters {
  page?: number;
  limit?: number;
  search?: string;
  includeAllStatuses?: boolean;
  marketType?: string;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly verificationService: VerificationService,
    private readonly walletService: WalletService,
  ) {}

  async createSaleListing(userId: string, userRole: UserRole, dto: CreateSaleListingDto) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      select: {username: true},
    });

    const imageUrls = dto.imageUrls ?? [];
    const totalShares = 1;
    const verification = this.verificationService.verifySubmission({
      ownerId: userId,
      sellerUsername: user?.username ?? 'citizen',
      title: dto.title,
      location: dto.location,
      ownerName: dto.ownerName,
      ownershipType: dto.ownershipType,
      ownershipProofType: dto.ownershipProofType,
      ownershipProofNumber: dto.ownershipProofNumber,
      description: dto.description,
      imageUrls,
      price: dto.price,
      propertyValue: dto.propertyValue,
      totalShares,
    });

    if (dto.sourcePropertyId) {
      const sourceProperty = await this.prisma.property.findUnique({
        where: {id: dto.sourcePropertyId},
      });

      if (!sourceProperty) {
        throw new NotFoundException('Owned property not found.');
      }
      if (sourceProperty.ownerId !== userId) {
        throw new ForbiddenException('You can only list your own property for sale.');
      }
      if (sourceProperty.marketType !== 'sale') {
        throw new BadRequestException(
          'Investment projects cannot be listed in the sell-property flow.',
        );
      }
      if (['pending_verification', 'verified', 'frozen'].includes(sourceProperty.status)) {
        throw new BadRequestException('This property already has an active sale lifecycle.');
      }

      const updatedProperty = await this.prisma.property.update({
        where: {id: sourceProperty.id},
        data: {
          marketType: 'sale',
          title: dto.title,
          location: dto.location,
          ownerName: dto.ownerName,
          ownershipType: dto.ownershipType,
          ownershipProofType: dto.ownershipProofType,
          ownershipProofNumber: dto.ownershipProofNumber,
          description: dto.description,
          imageUrls,
          price: dto.price,
          propertyValue: dto.propertyValue,
          totalShares,
          availableShares: totalShares,
          ...(dto.city !== undefined ? {city: dto.city} : {}),
          ...(dto.propertyType !== undefined ? {propertyType: dto.propertyType} : {}),
          ...(dto.bedrooms !== undefined ? {bedrooms: dto.bedrooms} : {}),
          ...(dto.bathrooms !== undefined ? {bathrooms: dto.bathrooms} : {}),
          ...(dto.areaSqm !== undefined ? {areaSqm: dto.areaSqm} : {}),
          ...(dto.amenities !== undefined ? {amenities: dto.amenities} : {}),
          ...(dto.latitude !== undefined ? {latitude: dto.latitude} : {}),
          ...(dto.longitude !== undefined ? {longitude: dto.longitude} : {}),
          status:
            verification.listingConsistent && verification.ownershipProofMatches
              ? 'pending_verification'
              : 'rejected',
          propertyVerificationStatus: verification.propertyVerificationStatus,
          identityVerificationStatus: verification.identityVerificationStatus,
          rejectionReason:
            verification.listingConsistent && verification.ownershipProofMatches
              ? null
              : 'Blockchain verification rejected the submission. Review ownership proof and listing consistency.',
          verificationRecordId: verification.verificationRecordId,
          verificationPayload: verification.verificationPayload,
          blockchainHash: verification.blockchainHash,
          blockchainTxId: null,
          blockchainStatus: verification.blockchainStatus,
          anchoredAt: null,
          verificationTimestamp: null,
        },
      });

      await this.auditService.log({
        actorId: userId,
        actorRole: userRole,
        actionType: 'listing_submitted',
        propertyId: updatedProperty.id,
        metadata: {
          title: updatedProperty.title,
          location: updatedProperty.location,
          askingPrice: updatedProperty.price,
          sourcePropertyId: sourceProperty.id,
          verificationRecordId: updatedProperty.verificationRecordId,
          blockchainStatus: updatedProperty.blockchainStatus,
        },
      });

      return this.mapPropertySummary(updatedProperty);
    }

    const property = await this.prisma.property.create({
      data: {
        ownerId: userId,
        marketType: 'sale',
        title: dto.title,
        location: dto.location,
        ownerName: dto.ownerName,
        ownershipType: dto.ownershipType,
        ownershipProofType: dto.ownershipProofType,
        ownershipProofNumber: dto.ownershipProofNumber,
        description: dto.description,
        imageUrls,
        price: dto.price,
        propertyValue: dto.propertyValue,
        totalShares,
        availableShares: totalShares,
        ...(dto.city !== undefined ? {city: dto.city} : {}),
        ...(dto.propertyType !== undefined ? {propertyType: dto.propertyType} : {}),
        ...(dto.bedrooms !== undefined ? {bedrooms: dto.bedrooms} : {}),
        ...(dto.bathrooms !== undefined ? {bathrooms: dto.bathrooms} : {}),
        ...(dto.areaSqm !== undefined ? {areaSqm: dto.areaSqm} : {}),
        ...(dto.amenities !== undefined ? {amenities: dto.amenities} : {}),
        ...(dto.latitude !== undefined ? {latitude: dto.latitude} : {}),
        ...(dto.longitude !== undefined ? {longitude: dto.longitude} : {}),
        status:
          verification.listingConsistent && verification.ownershipProofMatches
            ? 'pending_verification'
            : 'rejected',
        propertyVerificationStatus: verification.propertyVerificationStatus,
        identityVerificationStatus: verification.identityVerificationStatus,
        rejectionReason:
          verification.listingConsistent && verification.ownershipProofMatches
            ? null
            : 'Blockchain verification rejected the submission. Review ownership proof and listing consistency.',
        verificationRecordId: verification.verificationRecordId,
        verificationPayload: verification.verificationPayload,
        blockchainHash: verification.blockchainHash,
        blockchainStatus: verification.blockchainStatus,
      },
    });

    await this.auditService.log({
      actorId: userId,
      actorRole: userRole,
      actionType: 'listing_submitted',
      propertyId: property.id,
      metadata: {
        title: property.title,
        location: property.location,
        askingPrice: property.price,
        verificationRecordId: property.verificationRecordId,
        blockchainStatus: property.blockchainStatus,
      },
    });

    return this.mapPropertySummary(property);
  }

  async getSaleListings(filters: ListingFilters = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const search = filters.search?.trim();

    const resolvedMarketType = (filters.marketType as 'sale' | 'investment' | 'rent') ?? 'sale';
    const priceFilter: Prisma.FloatFilter | undefined =
      filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            ...(filters.minPrice !== undefined ? {gte: filters.minPrice} : {}),
            ...(filters.maxPrice !== undefined ? {lte: filters.maxPrice} : {}),
          }
        : undefined;

    const where: Prisma.PropertyWhereInput = {
      marketType: resolvedMarketType,
      ...(filters.includeAllStatuses ? {} : {status: 'verified'}),
      ...(search
        ? {
            OR: [
              {title: {contains: search, mode: 'insensitive'}},
              {location: {contains: search, mode: 'insensitive'}},
              {ownerName: {contains: search, mode: 'insensitive'}},
            ],
          }
        : {}),
      ...(filters.city ? {city: {contains: filters.city, mode: 'insensitive'}} : {}),
      ...(filters.propertyType
        ? {propertyType: {contains: filters.propertyType, mode: 'insensitive'}}
        : {}),
      ...(priceFilter ? {price: priceFilter} : {}),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
      filters.sort === 'price_asc'
        ? [{price: 'asc'}]
        : filters.sort === 'price_desc'
          ? [{price: 'desc'}]
          : [{updatedAt: 'desc'}];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({where}),
    ]);

    return {
      items: items.map(property => this.mapPropertySummary(property)),
      page,
      limit,
      total,
    };
  }

  async getPropertyDetails(id: string, viewerId?: string, viewerRole?: UserRole) {
    const property = await this.prisma.property.findUnique({
      where: {id},
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
        auditLogs: {
          orderBy: {timestamp: 'desc'},
          take: 10,
          include: {
            actor: {
              select: {username: true},
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    const canViewPrivate =
      viewerRole === 'admin' || Boolean(viewerId && property.ownerId === viewerId);
    if (property.status !== 'verified' && !canViewPrivate) {
      throw new ForbiddenException('This listing is not available.');
    }

    return {
      ...this.mapPropertySummary(property),
      ownerId: property.ownerId,
      seller: property.owner
        ? {
            id: property.owner.id,
            username: property.owner.username,
          }
        : null,
      marketType: property.marketType,
      ownershipType: property.ownershipType,
      ownershipProofType: property.ownershipProofType,
      ownershipProofNumber: property.ownershipProofNumber,
      description: property.description,
      imageUrls: this.parseImageUrls(property.imageUrls),
      availableShares: property.availableShares,
      totalShares: property.totalShares,
      pricePerShare: Number((property.price / property.totalShares).toFixed(2)),
      propertyVerificationStatus: property.propertyVerificationStatus,
      identityVerificationStatus: property.identityVerificationStatus,
      rejectionReason: property.rejectionReason,
      verificationRecordId: property.verificationRecordId,
      verificationPayload: property.verificationPayload,
      blockchainHash: property.blockchainHash ?? '',
      blockchainTransactionId: property.blockchainTxId ?? '',
      blockchainStatus: property.blockchainStatus,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      auditTrail: property.auditLogs.map(log => ({
        id: log.id,
        actorName: log.actor?.username ?? 'System',
        actorRole: log.actorRole,
        actionType: log.actionType,
        timestamp: log.timestamp.toISOString(),
        metadata: log.metadata,
      })),
    };
  }

  async buySaleProperty(id: string, buyerId: string, buyerRole: UserRole) {
    const [buyer, property] = await Promise.all([
      this.prisma.user.findUnique({
        where: {id: buyerId},
        select: {id: true, username: true},
      }),
      this.prisma.property.findUnique({
        where: {id},
      }),
    ]);

    if (!buyer) {
      throw new NotFoundException('Buyer account not found.');
    }
    if (!property) {
      throw new NotFoundException('Property not found.');
    }
    if (property.marketType !== 'sale') {
      throw new BadRequestException(
        'Only sale listings can be purchased directly.',
      );
    }
    if (property.status !== 'verified' || property.availableShares < 1) {
      throw new BadRequestException(
        'Only verified sale listings that are still available can be purchased.',
      );
    }
    if (property.ownerId === buyerId) {
      throw new BadRequestException('You already own this property.');
    }

    const purchasedProperty = await this.prisma.property.update({
      where: {id: property.id},
      data: {
        ownerId: buyer.id,
        ownerName: buyer.username,
        status: 'sold',
        availableShares: 0,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: buyerId,
      actorRole: buyerRole,
      actionType: 'listing_submitted',
      propertyId: purchasedProperty.id,
      metadata: {
        event: 'property_purchased',
        previousOwnerId: property.ownerId,
        previousOwnerName: property.ownerName,
        buyerId: buyer.id,
        buyerUsername: buyer.username,
        price: purchasedProperty.price,
      },
    });

    return {
      ...this.mapPropertySummary(purchasedProperty),
      message: 'Property purchased successfully.',
    };
  }

  async buySalePropertyWithWallet(id: string, buyerId: string, buyerRole: UserRole) {
    const [buyer, property] = await Promise.all([
      this.prisma.user.findUnique({where: {id: buyerId}, select: {id: true, username: true}}),
      this.prisma.property.findUnique({where: {id}}),
    ]);

    if (!buyer) throw new NotFoundException('Buyer account not found.');
    if (!property) throw new NotFoundException('Property not found.');
    if (property.marketType !== 'sale') {
      throw new BadRequestException('Only sale listings can be purchased directly.');
    }
    if (property.status !== 'verified' || property.availableShares < 1) {
      throw new BadRequestException('Property is not available for purchase.');
    }
    if (property.ownerId === buyerId) {
      throw new BadRequestException('You already own this property.');
    }

    const purchasedProperty = await this.prisma.$transaction(async tx => {
      await this.walletService.debitInTransaction(
        tx,
        buyerId,
        property.price,
        WalletTxType.purchase,
        `Property purchase: ${property.title}`,
        property.title,
      );

      return tx.property.update({
        where: {id: property.id},
        data: {
          ownerId: buyer.id,
          ownerName: buyer.username,
          status: 'sold',
          availableShares: 0,
          updatedAt: new Date(),
        },
      });
    });

    await this.auditService.log({
      actorId: buyerId,
      actorRole: buyerRole,
      actionType: 'listing_submitted',
      propertyId: purchasedProperty.id,
      metadata: {
        event: 'property_purchased_with_wallet',
        previousOwnerId: property.ownerId,
        buyerId: buyer.id,
        buyerUsername: buyer.username,
        price: purchasedProperty.price,
        paymentMethod: 'ejod_wallet',
      },
    });

    return {
      ...this.mapPropertySummary(purchasedProperty),
      message: 'Property purchased successfully with Ejod Wallet.',
    };
  }

  private mapPropertySummary(property: Property) {
    return {
      id: property.id,
      title: property.title,
      location: property.location,
      ownerName: property.ownerName,
      description: property.description,
      price: property.price,
      propertyValue: property.propertyValue,
      totalShares: property.totalShares,
      availableShares: property.availableShares,
      marketType: property.marketType,
      verificationStatus: property.status,
      verificationTimestamp:
        property.verificationTimestamp?.toISOString() ??
        property.updatedAt.toISOString(),
      city: property.city ?? null,
      propertyType: property.propertyType ?? null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      areaSqm: property.areaSqm ?? null,
      amenities: this.parseAmenities(property.amenities),
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
      imageUrls: this.parseImageUrls(property.imageUrls),
    };
  }

  private parseAmenities(amenities: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(amenities)) {
      return [];
    }
    return amenities.filter((value): value is string => typeof value === 'string');
  }

  private parseImageUrls(imageUrls: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(imageUrls)) {
      return [];
    }

    return imageUrls.filter((value): value is string => typeof value === 'string');
  }
}
