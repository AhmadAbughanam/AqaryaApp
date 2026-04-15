import {INestApplication, ValidationPipe} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Test, TestingModule} from '@nestjs/testing';
import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import {AppModule} from '../src/app.module';

export interface SeededData {
  users: {
    admin: {id: string; username: string};
    citizen: {id: string; username: string};
    citizen2: {id: string; username: string};
  };
  properties: {
    investmentAnchoredId: string;
    investmentOpenId: string;
    saleVerifiedId: string;
    salePendingId: string;
    saleRejectedId: string;
    saleSoldId: string;
    saleOwnedDraftId: string;
    rentVerifiedId: string;
    saleNeedsChangesId: string;
  };
  opportunities: {
    publishedAqaryaApprovedId: string;
    publishedPremiumVerifiedId: string;
    publishedVerifiedId: string;
    underReviewId: string;
    rejectedId: string;
    submittedId: string;
  };
  threads: {
    listingThreadId: string;
    opportunityThreadId: string;
  };
  savedSearchId: string;
  notificationId: string;
  providerProfiles: {
    citizenProfileId: string;
    citizen2ProfileId: string;
  };
  moderation: {
    openReportId: string;
  };
  cms: {
    announcementId: string;
    contentBlockKey: string;
  };
}

export const prisma = new PrismaClient();

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  return app;
};

export const createLegacyAdminToken = (
  app: INestApplication,
  payloadRole: 'dlsadmin' | 'auditor' | 'analyst',
) => {
  const jwtService = app.get(JwtService);

  return jwtService.sign({
    sub: 'legacy-admin',
    username: payloadRole,
    role: payloadRole,
  });
};

export const resetDatabase = async (): Promise<void> => {
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.investmentSimulation.deleteMany();
  await prisma.qualityFlag.deleteMany();
  await prisma.moderationReport.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.investmentOpportunity.deleteMany();
  await prisma.property.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();
};

export const seedDatabase = async (): Promise<SeededData> => {
  const passwordHash = await bcrypt.hash('123456', 10);

  const [admin, citizen, citizen2] = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        username: 'citizen',
        passwordHash,
        role: 'citizen',
      },
    }),
    prisma.user.create({
      data: {
        username: 'citizen2',
        passwordHash,
        role: 'citizen',
      },
    }),
  ]);

  const [citizenProfile, citizen2Profile] = await Promise.all([
    prisma.providerProfile.create({
      data: {
        userId: citizen.id,
        accountType: 'owner',
        providerVerificationStatus: 'under_review',
        businessName: 'Citizen Realty',
        contactPerson: 'Test Citizen',
        phone: '+962-79-555-0001',
        email: 'citizen@test.local',
        registrationNumber: 'REG-TEST-001',
        providerType: 'Individual Property Owner',
        submittedAt: new Date('2026-03-01T10:00:00.000Z'),
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: citizen2.id,
        accountType: 'agency',
        providerVerificationStatus: 'verified',
        businessName: 'Citizen2 Agency',
        contactPerson: 'Test Citizen Two',
        phone: '+962-79-555-0002',
        email: 'citizen2@test.local',
        registrationNumber: 'REG-TEST-002',
        licenseNumber: 'LIC-AGY-002',
        providerType: 'Real Estate Agency',
        adminNotes: 'Verified in March 2026 seeding round.',
        submittedAt: new Date('2026-02-15T10:00:00.000Z'),
        reviewedAt: new Date('2026-02-20T10:00:00.000Z'),
      },
    }),
  ]);

  const verifiedAnchored = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'investment',
      title: 'Verified Hash Project',
      location: 'Amman',
      ownerName: 'Owner One',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-1001',
      description: 'A verified downtown project prepared for fractional investment.',
      imageUrls: ['https://example.com/verified-hash.jpg'],
      status: 'verified',
      propertyVerificationStatus: 'verified',
      identityVerificationStatus: 'verified',
      price: 1000000,
      propertyValue: 1000000,
      totalShares: 1000,
      availableShares: 600,
      verificationTimestamp: new Date('2026-03-10T09:00:00.000Z'),
      verificationRecordId: 'aqarya-vrf-seeded-verified-hash',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
        investmentProfile: {
          assetClass: 'Residential',
          stage: 'Operational',
          sponsorName: 'Test Sponsor One',
          riskBand: 'Balanced',
          targetHoldYears: 5,
          targetIrr: 0.14,
          targetCashYield: 0.08,
          appreciationRate: 0.06,
          occupancyRate: 0.93,
          managementFeeRate: 0.0125,
          minimumShares: 10,
          fundingProgress: 0.71,
          distributionFrequency: 'Quarterly',
        },
      },
      blockchainHash: '0xabc123',
      blockchainTxId: '0xtx123',
      blockchainStatus: 'anchored',
      anchoredAt: new Date('2026-03-10T09:10:00.000Z'),
    },
  });

  const verifiedOpen = await prisma.property.create({
    data: {
      ownerId: citizen2.id,
      marketType: 'investment',
      title: 'Verified Open Project',
      location: 'Irbid',
      ownerName: 'Owner Two',
      ownershipType: 'Leasehold',
      ownershipProofType: 'municipal_record',
      ownershipProofNumber: 'MR-204',
      description: 'A verified project that still has shares available to simulate.',
      imageUrls: ['https://example.com/verified-open.jpg'],
      status: 'verified',
      propertyVerificationStatus: 'verified',
      identityVerificationStatus: 'verified',
      price: 500000,
      propertyValue: 500000,
      totalShares: 500,
      availableShares: 500,
      verificationTimestamp: new Date('2026-03-11T09:00:00.000Z'),
      verificationRecordId: 'aqarya-vrf-seeded-open',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
        investmentProfile: {
          assetClass: 'Commercial',
          stage: 'Lease-up',
          sponsorName: 'Test Sponsor Two',
          riskBand: 'Moderate',
          targetHoldYears: 6,
          targetIrr: 0.16,
          targetCashYield: 0.085,
          appreciationRate: 0.061,
          occupancyRate: 0.87,
          managementFeeRate: 0.013,
          minimumShares: 15,
          fundingProgress: 0.63,
          distributionFrequency: 'Quarterly',
        },
      },
      blockchainHash: '0xverifiedopenhash',
      blockchainStatus: 'pending',
    },
  });

  const pending = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'sale',
      title: 'Pending Sale Home',
      location: 'Zarqa',
      ownerName: 'Owner Three',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-808',
      description: 'A newly submitted property awaiting both identity and title checks.',
      imageUrls: ['https://example.com/pending.jpg'],
      status: 'pending_verification',
      propertyVerificationStatus: 'pending',
      identityVerificationStatus: 'pending',
      price: 800000,
      propertyValue: 800000,
      totalShares: 1,
      availableShares: 1,
      verificationRecordId: 'aqarya-vrf-seeded-pending',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      blockchainHash: '0xpendinghash',
      blockchainStatus: 'pending',
    },
  });

  const verifiedSale = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'sale',
      title: 'Verified Sale House',
      location: 'Amman, Dabouq',
      ownerName: 'Owner Sale',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-SALE-11',
      description: 'A verified direct-sale house that can be purchased by another citizen.',
      imageUrls: ['https://example.com/verified-sale.jpg'],
      status: 'verified',
      propertyVerificationStatus: 'verified',
      identityVerificationStatus: 'verified',
      price: 950000,
      propertyValue: 930000,
      totalShares: 1,
      availableShares: 1,
      verificationTimestamp: new Date('2026-03-08T09:00:00.000Z'),
      verificationRecordId: 'aqarya-vrf-seeded-sale-verified',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      blockchainHash: '0xverifiedsalehash',
      blockchainTxId: '0xverifiedsaletx',
      blockchainStatus: 'anchored',
      anchoredAt: new Date('2026-03-08T09:05:00.000Z'),
    },
  });

  const rejected = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'sale',
      title: 'Rejected Sale Home',
      location: 'Aqaba',
      ownerName: 'Owner Four',
      ownershipType: 'Leasehold',
      ownershipProofType: 'municipal_record',
      ownershipProofNumber: 'MR-551',
      description: 'A rejected listing with mismatched ownership evidence.',
      imageUrls: ['https://example.com/rejected.jpg'],
      status: 'rejected',
      propertyVerificationStatus: 'rejected',
      identityVerificationStatus: 'rejected',
      rejectionReason: 'Ownership proof mismatch.',
      verificationRecordId: 'aqarya-vrf-seeded-rejected',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      price: 350000,
      propertyValue: 350000,
      totalShares: 1,
      availableShares: 1,
      blockchainHash: '0xrejectedhash',
      blockchainStatus: 'failed',
    },
  });

  const needsChanges = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'sale',
      title: 'Needs Changes Home',
      location: 'Amman, Marj',
      ownerName: 'Owner Seven',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-333',
      description: 'A listing that was sent back to the owner for corrections.',
      imageUrls: ['https://example.com/needs-changes.jpg'],
      status: 'needs_changes',
      propertyVerificationStatus: 'pending',
      identityVerificationStatus: 'pending',
      reviewerNotes: 'Please upload a clearer copy of the title deed and correct the property value.',
      price: 500000,
      propertyValue: 490000,
      totalShares: 1,
      availableShares: 1,
      verificationRecordId: 'aqarya-vrf-seeded-needs-changes',
      verificationPayload: {provider: 'mock-chain', network: 'testnet'},
      blockchainHash: '0xneedschangeshash',
      blockchainStatus: 'pending',
    },
  });

  const sold = await prisma.property.create({
    data: {
      ownerId: citizen2.id,
      marketType: 'sale',
      title: 'Sold Family House',
      location: 'Madaba',
      ownerName: 'Owner Five',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-901',
      description: 'A fully simulated property with no shares left.',
      imageUrls: ['https://example.com/sold.jpg'],
      status: 'sold',
      propertyVerificationStatus: 'verified',
      identityVerificationStatus: 'verified',
      price: 200000,
      propertyValue: 200000,
      totalShares: 1,
      availableShares: 0,
      verificationTimestamp: new Date('2026-03-09T09:00:00.000Z'),
      verificationRecordId: 'aqarya-vrf-seeded-sold',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      blockchainHash: '0xsoldhash',
      blockchainTxId: '0xsoldtx',
      blockchainStatus: 'anchored',
      anchoredAt: new Date('2026-03-09T09:05:00.000Z'),
    },
  });

  const ownedDraft = await prisma.property.create({
    data: {
      ownerId: citizen.id,
      marketType: 'sale',
      title: 'Owned Draft House',
      location: 'Jerash',
      ownerName: 'Owner Six',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-CIT-001',
      description: 'A private owned house that has not been listed for public sale yet.',
      imageUrls: ['https://example.com/owned-draft.jpg'],
      status: 'rejected',
      propertyVerificationStatus: 'rejected',
      identityVerificationStatus: 'verified',
      rejectionReason: 'Not yet submitted for sale in the current cycle.',
      price: 420000,
      propertyValue: 400000,
      totalShares: 1,
      availableShares: 1,
      verificationRecordId: 'aqarya-vrf-seeded-owned-draft',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      blockchainHash: '0xowneddrafthash',
      blockchainStatus: 'failed',
    },
  });

  const rentVerified = await prisma.property.create({
    data: {
      ownerId: citizen2.id,
      marketType: 'rent',
      title: 'Verified Rental Apartment',
      location: 'Amman, Sweifieh',
      city: 'Amman',
      propertyType: 'Apartment',
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 110,
      amenities: ['Parking', 'Elevator', 'Security'],
      ownerName: 'Owner Rent',
      ownershipType: 'Freehold',
      ownershipProofType: 'title_deed',
      ownershipProofNumber: 'TD-RENT-SEED-01',
      description: 'A verified rental apartment available for monthly tenancy.',
      imageUrls: ['https://example.com/rent-verified.jpg'],
      status: 'verified',
      propertyVerificationStatus: 'verified',
      identityVerificationStatus: 'verified',
      price: 650,
      propertyValue: 180000,
      totalShares: 1,
      availableShares: 1,
      verificationTimestamp: new Date('2026-03-15T09:00:00.000Z'),
      verificationRecordId: 'aqarya-vrf-seeded-rent-verified',
      verificationPayload: {
        provider: 'mock-chain',
        network: 'testnet',
      },
      blockchainHash: '0xrentverifiedhash',
      blockchainTxId: '0xrentverifiedtx',
      blockchainStatus: 'anchored',
      anchoredAt: new Date('2026-03-15T09:05:00.000Z'),
    },
  });

  await prisma.simulation.create({
    data: {
      userId: citizen.id,
      propertyId: verifiedOpen.id,
      shares: 5,
      pricePerShare: 1000,
      subtotal: 5000,
      platformFee: 100,
      governmentFee: 50,
      totalAmount: 5150,
      ownershipPercentage: 1,
      expectedAnnualReturn: 400,
      expectedFiveYearReturn: 2000,
      simulatedValue: 5000,
    },
  });

  const [
    oppPublishedAqarya,
    oppPublishedPremium,
    oppPublishedVerified,
    oppUnderReview,
    oppRejected,
  ] = await Promise.all([
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Abdali Residence Fund',
        location: 'Amman, Abdali',
        description: 'Seeded published opportunity — aqarya_approved.',
        imageUrls: ['https://example.com/opp-abdali.jpg'],
        assetClass: 'Residential',
        stage: 'Operational',
        sponsorName: 'Aqarya Capital',
        ownershipStructure: 'SPV',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 5000,
        availableShares: 2000,
        pricePerShare: 200,
        minimumShares: 25,
        targetIrr: 0.145,
        targetCashYield: 0.082,
        targetHoldYears: 5,
        appreciationRate: 0.06,
        occupancyRate: 0.94,
        managementFeeRate: 0.012,
        riskBand: 'Balanced',
        trustScore: 92,
        trustBadge: 'aqarya_approved',
        publishedAt: new Date('2026-03-15T10:00:00.000Z'),
        reviewedAt: new Date('2026-03-14T15:00:00.000Z'),
        blockchainHash: '0xtest-opp-abdali-hash',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-15T10:05:00.000Z'),
      },
    }),
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Northern Gate Commercial',
        location: 'Irbid, University Street',
        description: 'Seeded published opportunity — premium_verified.',
        imageUrls: ['https://example.com/opp-northern.jpg'],
        assetClass: 'Commercial',
        stage: 'Lease-up',
        sponsorName: 'Northern Gate Sponsors',
        ownershipStructure: 'Co-ownership',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 4000,
        availableShares: 3000,
        pricePerShare: 250,
        minimumShares: 20,
        targetIrr: 0.16,
        targetCashYield: 0.085,
        targetHoldYears: 6,
        appreciationRate: 0.061,
        occupancyRate: 0.87,
        managementFeeRate: 0.013,
        riskBand: 'Growth',
        trustScore: 74,
        trustBadge: 'premium_verified',
        publishedAt: new Date('2026-03-20T09:00:00.000Z'),
        reviewedAt: new Date('2026-03-19T14:00:00.000Z'),
        blockchainStatus: 'pending',
      },
    }),
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Red Sea Marina Hospitality',
        location: 'Aqaba, Marina Zone',
        description: 'Seeded published opportunity — verified.',
        imageUrls: ['https://example.com/opp-redsea.jpg'],
        assetClass: 'Hospitality',
        stage: 'Development',
        sponsorName: 'Red Sea Ventures',
        ownershipStructure: 'SPV',
        distributionModel: 'Semi-annual',
        exitModel: 'Buyback',
        totalShares: 8000,
        availableShares: 7500,
        pricePerShare: 180,
        minimumShares: 30,
        targetIrr: 0.18,
        targetCashYield: 0.075,
        targetHoldYears: 7,
        appreciationRate: 0.07,
        occupancyRate: 0.82,
        managementFeeRate: 0.014,
        riskBand: 'Aggressive',
        trustScore: 58,
        trustBadge: 'verified',
        publishedAt: new Date('2026-03-25T11:00:00.000Z'),
        reviewedAt: new Date('2026-03-24T16:00:00.000Z'),
        blockchainStatus: 'pending',
      },
    }),
    prisma.investmentOpportunity.create({
      data: {
        status: 'under_review',
        title: 'Salt Heritage Mixed Use',
        location: 'Al-Salt, Old Town',
        description: 'Seeded under_review opportunity.',
        imageUrls: [],
        assetClass: 'Mixed Use',
        stage: 'Pre-Development',
        sponsorName: 'Salt Heritage Partners',
        ownershipStructure: 'Direct Co-ownership',
        distributionModel: 'Annual',
        exitModel: 'Asset Sale',
        totalShares: 3000,
        availableShares: 3000,
        pricePerShare: 300,
        minimumShares: 10,
        targetIrr: 0.13,
        targetCashYield: 0.07,
        targetHoldYears: 8,
        appreciationRate: 0.055,
        occupancyRate: 0.79,
        managementFeeRate: 0.015,
        riskBand: 'Balanced',
        blockchainStatus: 'pending',
      },
    }),
    prisma.investmentOpportunity.create({
      data: {
        status: 'rejected',
        title: 'Zarqa Mall Expansion',
        location: 'Zarqa, New Downtown',
        description: 'Seeded rejected opportunity.',
        imageUrls: [],
        assetClass: 'Commercial',
        stage: 'Pre-Development',
        sponsorName: 'Zarqa Retail Holdings',
        ownershipStructure: 'SPV',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 10000,
        availableShares: 10000,
        pricePerShare: 100,
        minimumShares: 50,
        targetIrr: 0.12,
        targetCashYield: 0.065,
        targetHoldYears: 5,
        appreciationRate: 0.05,
        occupancyRate: 0.75,
        managementFeeRate: 0.015,
        riskBand: 'Conservative',
        rejectionReason: 'Incomplete sponsor identity verification.',
        reviewedAt: new Date('2026-03-28T12:00:00.000Z'),
        blockchainStatus: 'pending',
      },
    }),
  ]);

  const oppSubmitted = await prisma.investmentOpportunity.create({
    data: {
      status: 'submitted',
      title: 'Petra Valley Resort',
      location: 'Petra, Jordan',
      description: 'Seeded submitted opportunity awaiting initial review.',
      imageUrls: [],
      assetClass: 'Hospitality',
      stage: 'Pre-Development',
      sponsorName: 'Petra Valley Partners',
      ownershipStructure: 'SPV',
      distributionModel: 'Annual',
      exitModel: 'Asset Sale',
      totalShares: 6000,
      availableShares: 6000,
      pricePerShare: 150,
      minimumShares: 20,
      targetIrr: 0.155,
      targetCashYield: 0.08,
      targetHoldYears: 6,
      appreciationRate: 0.065,
      occupancyRate: 0.88,
      managementFeeRate: 0.013,
      riskBand: 'Growth',
      blockchainStatus: 'pending',
    },
  });

  // Phase 4: threads for messaging tests
  const [listingThread, opportunityThread] = await Promise.all([
    prisma.thread.create({
      data: {
        subject: 'Test inquiry about sale listing',
        citizenId: citizen.id,
        listingId: verifiedSale.id,
      },
    }),
    prisma.thread.create({
      data: {
        subject: 'Test inquiry about investment opportunity',
        citizenId: citizen.id,
        opportunityId: oppPublishedAqarya.id,
      },
    }),
  ]);

  await prisma.message.createMany({
    data: [
      {
        threadId: listingThread.id,
        senderId: citizen.id,
        senderRole: 'citizen',
        body: 'Hello, is this property still available?',
      },
      {
        threadId: opportunityThread.id,
        senderId: citizen.id,
        senderRole: 'citizen',
        body: 'I am interested in investing. Can I get more details?',
      },
    ],
  });

  // Phase 5: saved search + notification for citizen
  const [savedSearch, notification] = await Promise.all([
    prisma.savedSearch.create({
      data: {
        userId: citizen.id,
        name: 'Test Amman Rentals',
        searchType: 'rent',
        filters: {city: 'Amman', maxPrice: 900},
      },
    }),
    prisma.notification.create({
      data: {
        userId: citizen.id,
        type: 'system',
        title: 'Welcome to Aqarya',
        body: 'Your account is set up. Start browsing verified listings.',
        isRead: false,
      },
    }),
  ]);

  // Seed a pre-existing open report for moderation tests
  const openReport = await prisma.moderationReport.create({
    data: {
      targetType: 'listing',
      targetId: verifiedSale.id,
      reporterId: citizen2.id,
      reason: 'misleading_info',
      notes: 'Description does not match the photos.',
      status: 'open',
    },
  });

  // Seed CMS test data
  const [seededAnnouncement, seededContentBlock] = await Promise.all([
    prisma.announcement.create({
      data: {
        title: 'Test Announcement',
        body: 'This is a seeded test announcement for e2e tests.',
        type: 'system',
        audience: 'all_citizens',
        status: 'active',
        createdBy: admin.id,
        sentAt: new Date(),
      },
    }),
    prisma.contentBlock.create({
      data: {
        key: 'test_help_intro',
        title: 'How Aqarya Works',
        body: 'Seeded test content block for e2e tests.',
        icon: '🏠',
        order: 0,
        active: true,
      },
    }),
  ]);

  return {
    users: {
      admin: {id: admin.id, username: admin.username},
      citizen: {id: citizen.id, username: citizen.username},
      citizen2: {id: citizen2.id, username: citizen2.username},
    },
    properties: {
      investmentAnchoredId: verifiedAnchored.id,
      investmentOpenId: verifiedOpen.id,
      saleVerifiedId: verifiedSale.id,
      salePendingId: pending.id,
      saleRejectedId: rejected.id,
      saleSoldId: sold.id,
      saleOwnedDraftId: ownedDraft.id,
      rentVerifiedId: rentVerified.id,
      saleNeedsChangesId: needsChanges.id,
    },
    opportunities: {
      publishedAqaryaApprovedId: oppPublishedAqarya.id,
      publishedPremiumVerifiedId: oppPublishedPremium.id,
      publishedVerifiedId: oppPublishedVerified.id,
      underReviewId: oppUnderReview.id,
      rejectedId: oppRejected.id,
      submittedId: oppSubmitted.id,
    },
    threads: {
      listingThreadId: listingThread.id,
      opportunityThreadId: opportunityThread.id,
    },
    savedSearchId: savedSearch.id,
    notificationId: notification.id,
    providerProfiles: {
      citizenProfileId: citizenProfile.id,
      citizen2ProfileId: citizen2Profile.id,
    },
    moderation: {
      openReportId: openReport.id,
    },
    cms: {
      announcementId: seededAnnouncement.id,
      contentBlockKey: seededContentBlock.key,
    },
  };
};

export const loginAndGetToken = async (
  app: INestApplication,
  username: string,
  password = '123456',
): Promise<string> => {
  const response = await request(app.getHttpServer()).post('/auth/login').send({
    username,
    password,
  });
  return response.body.token as string;
};
