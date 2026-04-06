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
  await prisma.auditLog.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.property.deleteMany();
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
