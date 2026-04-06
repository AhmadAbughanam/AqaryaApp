import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.auditLog.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const [admin, citizenA, citizenB, citizenC] = await Promise.all([
    prisma.user.create({
      data: {username: 'admin', passwordHash, role: 'admin'},
    }),
    prisma.user.create({
      data: {username: 'citizen', passwordHash, role: 'citizen'},
    }),
    prisma.user.create({
      data: {username: 'citizen2', passwordHash, role: 'citizen'},
    }),
    prisma.user.create({
      data: {username: 'citizen3', passwordHash, role: 'citizen'},
    }),
  ]);

  const properties = await Promise.all([
    prisma.property.create({
      data: {
        ownerId: citizenA.id,
        marketType: 'investment',
        title: 'Al Noor Residence Block A',
        location: 'Amman, Abdali District',
        ownerName: 'Mahmoud Al-Khatib',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-1001',
        description:
          'A mixed-use residential tower with stable occupancy and strong downtown demand.',
        imageUrls: [
          'https://images.example.com/properties/al-noor-1.jpg',
          'https://images.example.com/properties/al-noor-2.jpg',
        ],
        price: 1550000,
        propertyValue: 1500000,
        totalShares: 10000,
        availableShares: 2500,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-02-12T09:20:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-001',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
          investmentProfile: {
            assetClass: 'Residential',
            stage: 'Operational',
            sponsorName: 'Aqarya Capital',
            riskBand: 'Balanced',
            targetHoldYears: 5,
            targetIrr: 0.14,
            targetCashYield: 0.078,
            appreciationRate: 0.058,
            occupancyRate: 0.94,
            managementFeeRate: 0.012,
            minimumShares: 25,
            fundingProgress: 0.74,
            distributionFrequency: 'Quarterly',
          },
        },
        blockchainHash:
          '0x7f8dd31fa6f4214f9cc441ea77c9a3f2126e4a2ac69d8f39f8a6e6230a1d4d79',
        blockchainTxId:
          '0x3abf1dd923e9e7f55a89c4db03b8ad4f73f8fbcf6a9e1476c2d7d0cb4ce11f28',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-02-12T09:20:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenB.id,
        marketType: 'investment',
        title: 'Irbid Commercial Plaza',
        location: 'Irbid, University Street',
        ownerName: 'Rana Al-Majali',
        ownershipType: 'Leasehold',
        ownershipProofType: 'municipal_record',
        ownershipProofNumber: 'MR-2026-221',
        description:
          'A neighborhood retail center positioned for mid-term rent growth.',
        imageUrls: ['https://images.example.com/properties/irbid-plaza-1.jpg'],
        price: 2250000,
        propertyValue: 2200000,
        totalShares: 12000,
        availableShares: 6100,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-01-24T14:45:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-002',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
          investmentProfile: {
            assetClass: 'Commercial',
            stage: 'Lease-up',
            sponsorName: 'Northern Gate Sponsors',
            riskBand: 'Moderate',
            targetHoldYears: 6,
            targetIrr: 0.16,
            targetCashYield: 0.085,
            appreciationRate: 0.061,
            occupancyRate: 0.87,
            managementFeeRate: 0.013,
            minimumShares: 40,
            fundingProgress: 0.62,
            distributionFrequency: 'Quarterly',
          },
        },
        blockchainHash:
          '0x9bc84f1d53b0d239af0eb6a031fd84a0a2b6bd7f1705f51273f26b2a8a3d9910',
        blockchainTxId:
          '0xa1727d8a4a20bcf88a98dd2f970d6f7c0de9e4dd8fcb7d56ffec8b19e7f1119b',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-01-24T14:45:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenC.id,
        marketType: 'investment',
        title: 'Aqaba Marina Income Fund',
        location: 'Aqaba, Marina Zone',
        ownerName: 'Leen Abu Saad',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-552',
        description:
          'Hospitality and retail waterfront project open for fractional investment.',
        imageUrls: ['https://images.example.com/properties/aqaba-income-fund-1.jpg'],
        price: 3180000,
        propertyValue: 3100000,
        totalShares: 15000,
        availableShares: 9400,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-02-18T08:30:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-006',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
          investmentProfile: {
            assetClass: 'Hospitality',
            stage: 'Stabilizing',
            sponsorName: 'Red Sea Ventures',
            riskBand: 'Growth',
            targetHoldYears: 5,
            targetIrr: 0.18,
            targetCashYield: 0.082,
            appreciationRate: 0.067,
            occupancyRate: 0.81,
            managementFeeRate: 0.014,
            minimumShares: 35,
            fundingProgress: 0.58,
            distributionFrequency: 'Semi-annual',
          },
        },
        blockchainHash:
          '0x09c4ce31727ff2ad706ecce3c2189d9038be07d9e1de8490a914f6f598f3f372',
        blockchainTxId:
          '0x8630999deeeaf74ae3046a57e18a45cfc044d18d29cc76ac5854e8df54da7f11',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-02-18T08:30:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenA.id,
        marketType: 'investment',
        title: 'Madaba Growth Project',
        location: 'Madaba, Ring Road',
        ownerName: 'Mahmoud Al-Khatib',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-6001',
        description:
          'Mid-scale mixed-use development with available units for investment simulation.',
        imageUrls: ['https://images.example.com/properties/madaba-growth-1.jpg'],
        price: 1980000,
        propertyValue: 1940000,
        totalShares: 9000,
        availableShares: 9000,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-03-01T10:15:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-007',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
          investmentProfile: {
            assetClass: 'Mixed use',
            stage: 'Development',
            sponsorName: 'Heritage Development Partners',
            riskBand: 'Growth',
            targetHoldYears: 7,
            targetIrr: 0.19,
            targetCashYield: 0.072,
            appreciationRate: 0.064,
            occupancyRate: 0.78,
            managementFeeRate: 0.014,
            minimumShares: 50,
            fundingProgress: 0.46,
            distributionFrequency: 'Semi-annual',
          },
        },
        blockchainHash:
          '0x3c8013de6c2a4fb2b0c26416dbcc67e4d8fe8b89a9b34ed982d636fe6ea3d34a',
        blockchainTxId:
          '0x333b6b6c6c0145f5f11d55ca6c372ef5ccfcf75428e55b9a71059e276f99e458',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-01T10:15:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenA.id,
        marketType: 'sale',
        title: 'Dabouq Family Villa',
        location: 'Amman, Dabouq',
        ownerName: 'Omar Al-Hindi',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-990',
        description:
          'Verified private villa listed for direct purchase by another citizen.',
        imageUrls: ['https://images.example.com/properties/dabouq-villa-1.jpg'],
        price: 2650000,
        propertyValue: 2600000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-02-20T09:00:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-008',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash:
          '0xc6c7c9ef04ca3f1d425a56bfca7bc0558dd88eef23dced4c14648ee247bf8031',
        blockchainTxId:
          '0x4b2f95ef4c7f91cf0e642fe13b5aeec65ca7b0f565e3da725469f0fe973a70a1',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-02-20T09:00:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenB.id,
        marketType: 'sale',
        title: 'Jerash Courtyard Home',
        location: 'Jerash, Old City',
        ownerName: 'Rana Al-Majali',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-9901',
        description:
          'Verified courtyard home available for direct sale in the citizen marketplace.',
        imageUrls: ['https://images.example.com/properties/jerash-courtyard-1.jpg'],
        price: 780000,
        propertyValue: 760000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-02-28T13:00:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-009',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash:
          '0x7ece5195f98ef9f95d70b36cf9c37f10c484d4f3516ed96e2efb92dcaa6a4f59',
        blockchainTxId:
          '0x39ad64bf8cd8ff8ad2bc4d58a1c20ccb17f70ddaf45fe0cb5f8cf2233dce0d57',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-02-28T13:00:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenA.id,
        marketType: 'sale',
        title: 'Zarqa Mixed Use Tower',
        location: 'Zarqa, New Downtown',
        ownerName: 'Omar Al-Hindi',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-991',
        description:
          'Pending citizen listing combining office, retail, and serviced apartments.',
        imageUrls: ['https://images.example.com/properties/zarqa-tower-1.jpg'],
        price: 3050000,
        propertyValue: 3000000,
        totalShares: 1,
        availableShares: 1,
        status: 'pending_verification',
        propertyVerificationStatus: 'pending',
        identityVerificationStatus: 'pending',
        verificationRecordId: 'aqarya-vrf-seed-003',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash:
          '0x2d99c12d94d2f9136c0f9225180dd10d676e0c61139efb4f3490cabd84b0a111',
        blockchainStatus: 'pending',
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenC.id,
        marketType: 'sale',
        title: 'Aqaba Marina Parcel 7',
        location: 'Aqaba, Marina Zone',
        ownerName: 'Leen Abu Saad',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-771',
        description:
          'A waterfront listing paused after identity review issues were discovered.',
        imageUrls: ['https://images.example.com/properties/aqaba-marina-1.jpg'],
        price: 1800000,
        propertyValue: 1780000,
        totalShares: 1,
        availableShares: 1,
        status: 'rejected',
        propertyVerificationStatus: 'rejected',
        identityVerificationStatus: 'rejected',
        rejectionReason: 'Ownership proof number does not match registry record.',
        verificationRecordId: 'aqarya-vrf-seed-004',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: false},
        },
        blockchainHash:
          '0x47dcb3088a40ee5c76ab6dd12782089c2096d3cf6bd2a10fa8cc28c28bd8af31',
        blockchainStatus: 'pending',
      },
    }),
    prisma.property.create({
      data: {
        ownerId: citizenB.id,
        marketType: 'sale',
        title: 'Salt Heritage Complex',
        location: 'Al-Salt, Old Town',
        ownerName: 'Yousef Al-Rawabdeh',
        ownershipType: 'Leasehold',
        ownershipProofType: 'municipal_record',
        ownershipProofNumber: 'MR-2025-870',
        description:
          'A heritage restoration project with part of inventory already simulated as sold.',
        imageUrls: ['https://images.example.com/properties/salt-heritage-1.jpg'],
        price: 1250000,
        propertyValue: 1250000,
        totalShares: 1,
        availableShares: 0,
        status: 'sold',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2025-12-10T10:10:00.000Z'),
        verificationRecordId: 'aqarya-vrf-seed-005',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash:
          '0xa9f2fb6d66712dc52d3e22f8beed85542ab7119e04be8d957965353a544ebcee',
        blockchainTxId:
          '0x1db31a139356a3f6584f698d692570561d6d2cbf651c3b808d3f6515620b12f1',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2025-12-10T10:10:00.000Z'),
      },
    }),
  ]);

  await prisma.simulation.createMany({
    data: [
      {
        userId: citizenA.id,
        propertyId: properties[1].id,
        shares: 150,
        pricePerShare: 187.5,
        subtotal: 28125,
        platformFee: 562.5,
        governmentFee: 281.25,
        totalAmount: 28968.75,
        ownershipPercentage: 1.25,
        expectedAnnualReturn: 2250,
        expectedFiveYearReturn: 11250,
        simulatedValue: 28125,
      },
      {
        userId: citizenB.id,
        propertyId: properties[0].id,
        shares: 250,
        pricePerShare: 155,
        subtotal: 38750,
        platformFee: 775,
        governmentFee: 387.5,
        totalAmount: 39912.5,
        ownershipPercentage: 2.5,
        expectedAnnualReturn: 3100,
        expectedFiveYearReturn: 15500,
        simulatedValue: 38750,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        actorRole: 'admin',
        actionType: 'listing_verified',
        propertyId: properties[0].id,
        metadata: {source: 'seed'},
      },
      {
        actorId: admin.id,
        actorRole: 'admin',
        actionType: 'anchor',
        propertyId: properties[0].id,
        metadata: {source: 'seed'},
      },
      {
        actorId: citizenA.id,
        actorRole: 'citizen',
        actionType: 'listing_submitted',
        propertyId: properties[2].id,
        metadata: {source: 'seed'},
      },
      {
        actorId: citizenA.id,
        actorRole: 'citizen',
        actionType: 'simulate',
        propertyId: properties[1].id,
        metadata: {source: 'seed'},
      },
    ],
  });
}

main()
  .catch(error => {
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
