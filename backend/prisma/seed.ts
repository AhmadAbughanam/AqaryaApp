import {PrismaClient, Prisma, WalletTxType, WalletTxStatus} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  // ── Cleanup (dependency order) ─────────────────────────────────────────────────
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
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ──────────────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {username: 'admin', passwordHash, role: 'admin'},
  });

  // ── 5 demo citizen users ───────────────────────────────────────────────────────
  // c1 omar_rashid  — active property owner + investor, highest wallet
  // c2 lina_haddad  — owner with investment activity
  // c3 rania_khouri — Aqaba-focused owner
  // c4 tariq_nassar — first-time investor, no owned properties
  // c5 yousef_barakat — buyer/browser, no owned properties
  const [c1, c2, c3, c4, c5] = await Promise.all([
    prisma.user.create({data: {username: 'omar_rashid', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'lina_haddad', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'rania_khouri', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'tariq_nassar', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'yousef_barakat', passwordHash, role: 'citizen'}}),
  ]);

  // ── Provider users ─────────────────────────────────────────────────────────────
  const [ownerUser, agencyUser, devUser, partnerUser, individualUser, suspendedUser] = await Promise.all([
    prisma.user.create({data: {username: 'owner1', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'agency1', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'dev1', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'partner1', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'individual1', passwordHash, role: 'citizen'}}),
    prisma.user.create({data: {username: 'suspended1', passwordHash, role: 'citizen'}}),
  ]);

  await Promise.all([
    prisma.providerProfile.create({
      data: {
        userId: ownerUser.id,
        accountType: 'owner',
        providerVerificationStatus: 'under_review',
        businessName: 'Al-Hindi Properties',
        contactPerson: 'Omar Al-Hindi',
        phone: '+962-79-111-2001',
        email: 'omar@alhindi-properties.jo',
        registrationNumber: 'REG-OWN-2026-001',
        providerType: 'Individual Property Owner',
        submittedAt: new Date('2026-03-10T09:00:00.000Z'),
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: agencyUser.id,
        accountType: 'agency',
        providerVerificationStatus: 'verified',
        businessName: 'Amman Elite Real Estate',
        contactPerson: 'Lara Nassar',
        phone: '+962-6-555-3000',
        email: 'lara@amman-elite.jo',
        registrationNumber: 'REG-AGY-2025-042',
        licenseNumber: 'LIC-JO-RERA-2025-042',
        providerType: 'Licensed Real Estate Agency',
        adminNotes: 'Verified against RERA database. License valid through 2027.',
        submittedAt: new Date('2026-01-15T09:00:00.000Z'),
        reviewedAt: new Date('2026-01-20T14:30:00.000Z'),
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: devUser.id,
        accountType: 'developer',
        providerVerificationStatus: 'under_review',
        businessName: 'Zarqa Development Group',
        contactPerson: 'Khaled Barakat',
        phone: '+962-79-222-5000',
        email: 'khaled@zarqa-dev.jo',
        registrationNumber: 'REG-DEV-2026-007',
        licenseNumber: 'LIC-JO-DEV-2026-007',
        providerType: 'Property Developer',
        submittedAt: new Date('2026-03-20T11:00:00.000Z'),
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: partnerUser.id,
        accountType: 'partner',
        providerVerificationStatus: 'rejected',
        businessName: 'Petra Financial Partners',
        contactPerson: 'Maha Qasim',
        phone: '+962-79-333-6001',
        email: 'maha@petra-fp.jo',
        registrationNumber: 'REG-PTR-2025-099',
        providerType: 'Investment Partner',
        rejectionReason:
          'Registration number could not be verified with the Ministry of Commerce. Please resubmit with a current company extract.',
        submittedAt: new Date('2026-02-01T10:00:00.000Z'),
        reviewedAt: new Date('2026-02-10T16:00:00.000Z'),
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: individualUser.id,
        accountType: 'individual',
        providerVerificationStatus: 'unverified',
        contactPerson: 'Nour Khalid',
        phone: '+962-79-444-7001',
        email: 'nour@personal.jo',
        providerType: 'Private Individual',
      },
    }),
    prisma.providerProfile.create({
      data: {
        userId: suspendedUser.id,
        accountType: 'owner',
        providerVerificationStatus: 'suspended',
        businessName: 'Aqaba Coastal Holdings',
        contactPerson: 'Rami Shawkat',
        phone: '+962-79-555-8001',
        email: 'rami@aqaba-coastal.jo',
        registrationNumber: 'REG-OWN-2025-055',
        providerType: 'Property Owner',
        adminNotes: 'Suspended pending compliance investigation opened 2026-03-28.',
        submittedAt: new Date('2025-12-01T09:00:00.000Z'),
        reviewedAt: new Date('2026-03-28T12:00:00.000Z'),
      },
    }),
  ]);

  // ── Ejod Wallets ───────────────────────────────────────────────────────────────
  // Balances reflect: deposits minus investments placed
  const [w1, w2, w3, w4, w5] = await Promise.all([
    prisma.wallet.create({data: {userId: c1.id, ejodBalance: 25000, lockedAmount: 0, pendingDeposits: 0}}),
    prisma.wallet.create({data: {userId: c2.id, ejodBalance: 6000, lockedAmount: 0, pendingDeposits: 0}}),
    prisma.wallet.create({data: {userId: c3.id, ejodBalance: 12000, lockedAmount: 0, pendingDeposits: 0}}),
    prisma.wallet.create({data: {userId: c4.id, ejodBalance: 5000, lockedAmount: 0, pendingDeposits: 0}}),
    prisma.wallet.create({data: {userId: c5.id, ejodBalance: 12000, lockedAmount: 0, pendingDeposits: 0}}),
  ]);

  await prisma.walletTransaction.createMany({
    data: [
      // Omar Al-Rashid: deposited 30,000 → invested 5,000 → balance 25,000
      {
        walletId: w1.id,
        type: WalletTxType.deposit,
        amount: 30000,
        status: WalletTxStatus.completed,
        description: 'Deposit via CliQ: omar-rashid',
        reference: 'DEP-SEED-0001',
        createdAt: new Date('2026-02-28T10:00:00.000Z'),
      },
      {
        walletId: w1.id,
        type: WalletTxType.investment,
        amount: 5000,
        status: WalletTxStatus.completed,
        description: 'Investment in Abdali Downtown Residence Fund',
        propertyTitle: 'Abdali Downtown Residence Fund',
        reference: 'PAY-SEED-0001',
        createdAt: new Date('2026-03-18T14:00:00.000Z'),
      },
      // Lina Haddad: deposited 10,000 → invested 4,000 → balance 6,000
      {
        walletId: w2.id,
        type: WalletTxType.deposit,
        amount: 10000,
        status: WalletTxStatus.completed,
        description: 'Deposit via CliQ: lina-haddad',
        reference: 'DEP-SEED-0002',
        createdAt: new Date('2026-03-05T09:00:00.000Z'),
      },
      {
        walletId: w2.id,
        type: WalletTxType.investment,
        amount: 4000,
        status: WalletTxStatus.completed,
        description: 'Investment in Northern Gate Commercial Park',
        propertyTitle: 'Northern Gate Commercial Park',
        reference: 'PAY-SEED-0002',
        createdAt: new Date('2026-03-22T11:00:00.000Z'),
      },
      // Rania Khouri: deposited 15,000 → invested 3,000 → balance 12,000
      {
        walletId: w3.id,
        type: WalletTxType.deposit,
        amount: 15000,
        status: WalletTxStatus.completed,
        description: 'Deposit via CliQ: rania-khouri',
        reference: 'DEP-SEED-0003',
        createdAt: new Date('2026-02-18T10:00:00.000Z'),
      },
      {
        walletId: w3.id,
        type: WalletTxType.investment,
        amount: 3000,
        status: WalletTxStatus.completed,
        description: 'Investment in Red Sea Marina Hospitality',
        propertyTitle: 'Red Sea Marina Hospitality',
        reference: 'PAY-SEED-0003',
        createdAt: new Date('2026-03-28T15:00:00.000Z'),
      },
      // Tariq Nassar: deposited 5,000 → no investments yet → balance 5,000
      {
        walletId: w4.id,
        type: WalletTxType.deposit,
        amount: 5000,
        status: WalletTxStatus.completed,
        description: 'Deposit via CliQ: tariq-nassar',
        reference: 'DEP-SEED-0004',
        createdAt: new Date('2026-03-12T08:00:00.000Z'),
      },
      // Yousef Barakat: deposited 12,000 → no investments yet → balance 12,000
      {
        walletId: w5.id,
        type: WalletTxType.deposit,
        amount: 12000,
        status: WalletTxStatus.completed,
        description: 'Deposit via CliQ: yousef-barakat',
        reference: 'DEP-SEED-0005',
        createdAt: new Date('2026-03-08T09:00:00.000Z'),
      },
    ],
  });

  // ── Investment + sale properties ───────────────────────────────────────────────
  const properties = await Promise.all([
    // [0] Investment — c1
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'investment',
        title: 'Al Noor Residence Block A',
        location: 'Amman, Abdali District',
        city: 'Amman',
        propertyType: 'Residential Tower',
        ownerName: 'Omar Al-Rashid',
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
        latitude: 31.9854,
        longitude: 35.9094,
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
    // [1] Investment — c2
    prisma.property.create({
      data: {
        ownerId: c2.id,
        marketType: 'investment',
        title: 'Irbid Commercial Plaza',
        location: 'Irbid, University Street',
        city: 'Irbid',
        propertyType: 'Commercial',
        ownerName: 'Lina Haddad',
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
        latitude: 32.5556,
        longitude: 35.8500,
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
    // [2] Investment — c3
    prisma.property.create({
      data: {
        ownerId: c3.id,
        marketType: 'investment',
        title: 'Aqaba Marina Income Fund',
        location: 'Aqaba, Marina Zone',
        city: 'Aqaba',
        propertyType: 'Mixed Use',
        ownerName: 'Rania Khouri',
        latitude: 29.5267,
        longitude: 35.0059,
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
        verificationRecordId: 'aqarya-vrf-seed-003',
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
    // [3] Investment — c1
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'investment',
        title: 'Madaba Growth Project',
        location: 'Madaba, Ring Road',
        city: 'Madaba',
        propertyType: 'Mixed Use',
        ownerName: 'Omar Al-Rashid',
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
        verificationRecordId: 'aqarya-vrf-seed-004',
        latitude: 31.7167,
        longitude: 35.7950,
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
    // [4] Sale verified — c1
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'sale',
        title: 'Dabouq Family Villa',
        location: 'Amman, Dabouq',
        city: 'Amman',
        propertyType: 'Villa',
        bedrooms: 5,
        bathrooms: 4,
        areaSqm: 380,
        amenities: ['Private garden', 'Garage', 'Swimming pool', 'Security'],
        ownerName: 'Omar Al-Rashid',
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
        latitude: 31.9830,
        longitude: 35.8520,
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
    // [5] Sale verified — c2
    prisma.property.create({
      data: {
        ownerId: c2.id,
        marketType: 'sale',
        title: 'Jerash Courtyard Home',
        location: 'Jerash, Old City',
        city: 'Jerash',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 210,
        amenities: ['Parking', 'Courtyard', 'Storage'],
        ownerName: 'Lina Haddad',
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
        latitude: 32.2731,
        longitude: 35.8997,
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
    // [6] Sale pending — c1
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'sale',
        title: 'Zarqa Mixed Use Tower',
        location: 'Zarqa, New Downtown',
        city: 'Zarqa',
        propertyType: 'Mixed Use',
        areaSqm: 12000,
        ownerName: 'Omar Al-Rashid',
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
        verificationRecordId: 'aqarya-vrf-seed-010',
        latitude: 32.0726,
        longitude: 36.0880,
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
    // [7] Sale rejected — c3
    prisma.property.create({
      data: {
        ownerId: c3.id,
        marketType: 'sale',
        title: 'Aqaba Marina Parcel 7',
        location: 'Aqaba, Marina Zone',
        city: 'Aqaba',
        propertyType: 'Land',
        areaSqm: 850,
        ownerName: 'Rania Khouri',
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
        verificationRecordId: 'aqarya-vrf-seed-011',
        latitude: 29.5180,
        longitude: 35.0100,
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
    // [8] Sale sold — c2
    prisma.property.create({
      data: {
        ownerId: c2.id,
        marketType: 'sale',
        title: 'Salt Heritage Complex',
        location: 'Al-Salt, Old Town',
        city: 'Al-Salt',
        propertyType: 'Heritage',
        areaSqm: 1200,
        ownerName: 'Lina Haddad',
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
        latitude: 32.0393,
        longitude: 35.7278,
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
    // [9] Sale needs_changes — c1
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'sale',
        title: 'Irbid Business Hub Floor 3',
        location: 'Irbid, Commerce Street',
        city: 'Irbid',
        propertyType: 'Commercial',
        areaSqm: 320,
        ownerName: 'Omar Al-Rashid',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-2026-IBD-003',
        latitude: 32.5440,
        longitude: 35.8450,
        description:
          'Third-floor commercial unit in a recently completed Irbid business complex. '
          + 'Returned for changes — ownership proof number needs correction.',
        imageUrls: [],
        price: 480000,
        propertyValue: 470000,
        totalShares: 1,
        availableShares: 1,
        status: 'needs_changes',
        propertyVerificationStatus: 'pending',
        identityVerificationStatus: 'verified',
        reviewerNotes:
          'Title deed number on file (TD-2026-IBD-003) does not match the municipal registry. '
          + 'Please resubmit with the corrected proof number before re-review.',
        verificationRecordId: 'aqarya-vrf-seed-012',
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainStatus: 'pending',
      },
    }),
  ]);

  // ── Rent listings ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'rent',
        title: 'Sweifieh Modern Apartment',
        location: 'Amman, Sweifieh',
        city: 'Amman',
        propertyType: 'Apartment',
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 130,
        amenities: ['Parking', 'Elevator', 'Gym', 'Security'],
        ownerName: 'Omar Al-Rashid',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-RENT-2026-001',
        description: 'Bright two-bedroom apartment in a well-maintained Sweifieh building. Monthly rent.',
        imageUrls: ['https://images.example.com/properties/sweifieh-apt-1.jpg'],
        price: 600,
        propertyValue: 170000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-03-10T09:00:00.000Z'),
        verificationRecordId: 'aqarya-vrf-rent-seed-001',
        latitude: 31.9481,
        longitude: 35.8700,
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash: '0xa1bc2de3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0',
        blockchainTxId: '0xb2cd3ef4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-10T09:05:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: c2.id,
        marketType: 'rent',
        title: 'University District Villa',
        location: 'Irbid, University District',
        city: 'Irbid',
        propertyType: 'Villa',
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 250,
        amenities: ['Garden', 'Parking', 'Security', 'Storage'],
        ownerName: 'Lina Haddad',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-RENT-2026-002',
        description: 'Spacious villa near JUST, ideal for families or faculty. Monthly rent.',
        imageUrls: ['https://images.example.com/properties/irbid-villa-rent-1.jpg'],
        price: 480,
        propertyValue: 280000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-03-12T10:00:00.000Z'),
        verificationRecordId: 'aqarya-vrf-rent-seed-002',
        latitude: 32.4725,
        longitude: 35.9857,
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash: '0xc3de4fg5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2',
        blockchainTxId: '0xd4ef5gh6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2c3',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-12T10:05:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: c3.id,
        marketType: 'rent',
        title: 'Aqaba Sea View Townhouse',
        location: 'Aqaba, Marina Zone',
        city: 'Aqaba',
        propertyType: 'Townhouse',
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 320,
        amenities: ['Sea view', 'Private terrace', 'Parking', 'Gym'],
        ownerName: 'Rania Khouri',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-RENT-2026-003',
        description: 'Premium townhouse with full sea views in Aqaba Marina. Monthly rent.',
        imageUrls: ['https://images.example.com/properties/aqaba-townhouse-rent-1.jpg'],
        price: 800,
        propertyValue: 420000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-03-14T11:00:00.000Z'),
        verificationRecordId: 'aqarya-vrf-rent-seed-003',
        latitude: 29.5180,
        longitude: 35.0070,
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash: '0xe5fg6hi7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2c3d4',
        blockchainTxId: '0xf6gh7ij8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-14T11:05:00.000Z'),
      },
    }),
    prisma.property.create({
      data: {
        ownerId: c1.id,
        marketType: 'rent',
        title: 'Zarqa City Studio',
        location: 'Zarqa, New Downtown',
        city: 'Zarqa',
        propertyType: 'Studio',
        bathrooms: 1,
        areaSqm: 58,
        amenities: ['Elevator', 'Security', 'Rooftop access'],
        ownerName: 'Omar Al-Rashid',
        ownershipType: 'Freehold',
        ownershipProofType: 'title_deed',
        ownershipProofNumber: 'TD-RENT-2026-004',
        description: 'Compact studio unit in Zarqa New Downtown, close to commercial hubs. Monthly rent.',
        imageUrls: ['https://images.example.com/properties/zarqa-studio-rent-1.jpg'],
        price: 250,
        propertyValue: 65000,
        totalShares: 1,
        availableShares: 1,
        status: 'verified',
        propertyVerificationStatus: 'verified',
        identityVerificationStatus: 'verified',
        verificationTimestamp: new Date('2026-03-16T09:30:00.000Z'),
        verificationRecordId: 'aqarya-vrf-rent-seed-004',
        latitude: 32.0750,
        longitude: 36.0900,
        verificationPayload: {
          provider: 'mock-chain',
          network: 'local-simnet',
          consistencyChecks: {hasPositivePrice: true},
          ownershipSignals: {ownerLinkedToAccount: true},
        },
        blockchainHash: '0xg7hi8jk9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6',
        blockchainTxId: '0xh8ij9kl0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6g7',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-16T09:35:00.000Z'),
      },
    }),
  ]);

  // ── Property investment simulations ────────────────────────────────────────────
  // pricePerShare: properties[1]=187.5, [0]=155, [2]=212, [3]=220
  await prisma.simulation.createMany({
    data: [
      {
        userId: c1.id,
        propertyId: properties[1].id,
        shares: 150,
        pricePerShare: 187.5,
        subtotal: 28125,
        platformFee: 421.88,
        governmentFee: 210.94,
        totalAmount: 28757.82,
        ownershipPercentage: 1.25,
        expectedAnnualReturn: 2390.63,
        expectedFiveYearReturn: 11953.13,
        simulatedValue: 28125,
      },
      {
        userId: c2.id,
        propertyId: properties[0].id,
        shares: 250,
        pricePerShare: 155,
        subtotal: 38750,
        platformFee: 581.25,
        governmentFee: 290.63,
        totalAmount: 39621.88,
        ownershipPercentage: 2.5,
        expectedAnnualReturn: 3022.5,
        expectedFiveYearReturn: 15112.5,
        simulatedValue: 38750,
      },
      // c4 (tariq) simulated on Aqaba Marina Income Fund (properties[2], 212 JOD/share)
      {
        userId: c4.id,
        propertyId: properties[2].id,
        shares: 100,
        pricePerShare: 212,
        subtotal: 21200,
        platformFee: 318,
        governmentFee: 159,
        totalAmount: 21677,
        ownershipPercentage: 0.67,
        expectedAnnualReturn: 1738.4,
        expectedFiveYearReturn: 8692,
        simulatedValue: 21200,
      },
      // c5 (yousef) simulated on Madaba Growth Project (properties[3], 220 JOD/share)
      {
        userId: c5.id,
        propertyId: properties[3].id,
        shares: 80,
        pricePerShare: 220,
        subtotal: 17600,
        platformFee: 264,
        governmentFee: 132,
        totalAmount: 17996,
        ownershipPercentage: 0.89,
        expectedAnnualReturn: 1267.2,
        expectedFiveYearReturn: 6336,
        simulatedValue: 17600,
      },
    ],
  });

  // ── Audit logs ─────────────────────────────────────────────────────────────────
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
        actorId: c3.id,
        actorRole: 'citizen',
        actionType: 'listing_submitted',
        propertyId: properties[2].id,
        metadata: {source: 'seed'},
      },
      {
        actorId: c1.id,
        actorRole: 'citizen',
        actionType: 'simulate',
        propertyId: properties[1].id,
        metadata: {source: 'seed'},
      },
    ],
  });

  // ── Investment Opportunities ────────────────────────────────────────────────────
  await Promise.all([
    // 1. Published + aqarya_approved — Residential, high trust score
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Abdali Downtown Residence Fund',
        location: 'Amman, Abdali District',
        description:
          'Fractional investment in a stabilized residential tower at the heart of Amman\'s new downtown. '
          + 'Anchored by long-term corporate tenants with verified rental income.',
        imageUrls: [
          'https://images.example.com/invest/abdali-fund-1.jpg',
          'https://images.example.com/invest/abdali-fund-2.jpg',
        ],
        assetClass: 'Residential',
        stage: 'Operational',
        sponsorName: 'Aqarya Capital Management',
        ownershipStructure: 'SPV (Special Purpose Vehicle)',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 10000,
        availableShares: 3200,
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
        verificationRecordId: 'aqarya-opp-vrf-001',
        blockchainHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        blockchainTxId: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        blockchainStatus: 'anchored',
        anchoredAt: new Date('2026-03-15T10:05:00.000Z'),
      },
    }),
    // 2. Published + premium_verified — Commercial, moderate trust
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Northern Gate Commercial Park',
        location: 'Irbid, University Street',
        description:
          'Income-producing commercial park near Jordan University of Science and Technology. '
          + 'Mix of retail and office units with strong lease-up trajectory.',
        imageUrls: ['https://images.example.com/invest/northern-gate-1.jpg'],
        assetClass: 'Commercial',
        stage: 'Lease-up',
        sponsorName: 'Northern Gate Sponsors',
        ownershipStructure: 'Co-ownership (Musharaka)',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 8000,
        availableShares: 4500,
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
        verificationRecordId: 'aqarya-opp-vrf-002',
        blockchainHash: '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
        blockchainStatus: 'pending',
      },
    }),
    // 3. Published + verified — Hospitality, base trust
    prisma.investmentOpportunity.create({
      data: {
        status: 'published',
        title: 'Red Sea Marina Hospitality',
        location: 'Aqaba, Marina Zone',
        description:
          'Waterfront hospitality and retail development open for fractional investment. '
          + 'Early-stage funding with development completion expected within 24 months.',
        imageUrls: ['https://images.example.com/invest/red-sea-marina-1.jpg'],
        assetClass: 'Hospitality',
        stage: 'Development',
        sponsorName: 'Red Sea Ventures LLC',
        ownershipStructure: 'SPV (Special Purpose Vehicle)',
        distributionModel: 'Semi-annual',
        exitModel: 'Buyback',
        totalShares: 15000,
        availableShares: 12000,
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
        verificationRecordId: 'aqarya-opp-vrf-003',
        blockchainHash: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
        blockchainStatus: 'pending',
      },
    }),
    // 4. under_review — Mixed Use
    prisma.investmentOpportunity.create({
      data: {
        status: 'under_review',
        title: 'Heritage Mixed Use — Salt Old Town',
        location: 'Al-Salt, Old Town',
        description:
          'A mixed-use heritage restoration project combining boutique hotel, curated retail, '
          + 'and co-working space. Under review for regulatory and financial compliance.',
        imageUrls: ['https://images.example.com/invest/salt-heritage-opp-1.jpg'],
        assetClass: 'Mixed Use',
        stage: 'Pre-Development',
        sponsorName: 'Salt Heritage Partners',
        ownershipStructure: 'Direct Co-ownership',
        distributionModel: 'Annual',
        exitModel: 'Asset Sale',
        totalShares: 5000,
        availableShares: 5000,
        pricePerShare: 300,
        minimumShares: 10,
        targetIrr: 0.13,
        targetCashYield: 0.07,
        targetHoldYears: 8,
        appreciationRate: 0.055,
        occupancyRate: 0.79,
        managementFeeRate: 0.015,
        riskBand: 'Balanced',
        verificationRecordId: 'aqarya-opp-vrf-004',
        blockchainStatus: 'pending',
      },
    }),
    // 5. rejected — Incomplete documentation
    prisma.investmentOpportunity.create({
      data: {
        status: 'rejected',
        title: 'Zarqa Mall Expansion Fund',
        location: 'Zarqa, New Downtown',
        description:
          'Proposed expansion of an existing retail mall. Submission was rejected due to '
          + 'incomplete sponsor identity verification and missing financial projections.',
        imageUrls: [],
        assetClass: 'Commercial',
        stage: 'Pre-Development',
        sponsorName: 'Zarqa Retail Holdings',
        ownershipStructure: 'SPV (Special Purpose Vehicle)',
        distributionModel: 'Quarterly',
        exitModel: 'Asset Sale',
        totalShares: 20000,
        availableShares: 20000,
        pricePerShare: 100,
        minimumShares: 50,
        targetIrr: 0.12,
        targetCashYield: 0.065,
        targetHoldYears: 5,
        appreciationRate: 0.05,
        occupancyRate: 0.75,
        managementFeeRate: 0.015,
        riskBand: 'Conservative',
        rejectionReason:
          'Incomplete sponsor identity verification and missing audited financial projections.',
        reviewedAt: new Date('2026-03-28T12:00:00.000Z'),
        blockchainStatus: 'pending',
      },
    }),
    // 6. submitted — awaiting first admin review
    prisma.investmentOpportunity.create({
      data: {
        status: 'submitted',
        title: 'Aqaba Waterfront Residences',
        location: 'Aqaba, Marina Zone',
        description:
          'A new residential development targeting the Aqaba tourism corridor. '
          + 'Freshly submitted by sponsor and awaiting initial admin review.',
        imageUrls: [],
        assetClass: 'Residential',
        stage: 'Pre-Development',
        sponsorName: 'Red Sea Capital',
        ownershipStructure: 'Direct Ownership',
        distributionModel: 'Annual',
        exitModel: 'Asset Sale',
        totalShares: 25000,
        availableShares: 25000,
        pricePerShare: 200,
        minimumShares: 25,
        targetIrr: 0.16,
        targetCashYield: 0.07,
        targetHoldYears: 7,
        appreciationRate: 0.08,
        occupancyRate: 0.0,
        managementFeeRate: 0.015,
        riskBand: 'Growth',
        blockchainStatus: 'pending',
      },
    }),
  ]);

  // ── Phase 4: Saved Items, Threads, Messages, Preferences ──────────────────────
  const [seedProperty, seedOpportunity] = await Promise.all([
    prisma.property.findFirst({where: {marketType: 'sale', status: 'verified'}}),
    prisma.investmentOpportunity.findFirst({where: {status: 'published', trustBadge: 'aqarya_approved'}}),
  ]);

  if (seedProperty && seedOpportunity) {
    // Saved items
    await Promise.all([
      prisma.savedItem.create({
        data: {userId: c1.id, type: 'listing', propertyId: seedProperty.id},
      }),
      prisma.savedItem.create({
        data: {userId: c1.id, type: 'opportunity', opportunityId: seedOpportunity.id},
      }),
      prisma.savedItem.create({
        data: {userId: c4.id, type: 'opportunity', opportunityId: seedOpportunity.id},
      }),
      prisma.savedItem.create({
        data: {userId: c5.id, type: 'listing', propertyId: seedProperty.id},
      }),
    ]);

    // Inquiry threads with messages
    const [listingThread, oppThread] = await Promise.all([
      prisma.thread.create({
        data: {
          subject: 'Inquiry about ' + seedProperty.title,
          citizenId: c1.id,
          listingId: seedProperty.id,
        },
      }),
      prisma.thread.create({
        data: {
          subject: 'Investment questions — ' + seedOpportunity.title,
          citizenId: c1.id,
          opportunityId: seedOpportunity.id,
        },
      }),
    ]);

    await prisma.message.createMany({
      data: [
        {
          threadId: listingThread.id,
          senderId: c1.id,
          senderRole: 'citizen',
          body: 'Hello, I am interested in this property. Is it still available for viewing?',
        },
        {
          threadId: listingThread.id,
          senderId: admin.id,
          senderRole: 'admin',
          body: 'Yes, the property is available. You can schedule a viewing by replying here.',
        },
        {
          threadId: oppThread.id,
          senderId: c1.id,
          senderRole: 'citizen',
          body: 'I would like to understand the SPV structure better before investing. Could you share the prospectus?',
        },
      ],
    });
  }

  // ── User preferences ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.userPreference.create({
      data: {userId: c1.id, notificationsEnabled: true, language: 'en'},
    }),
    prisma.userPreference.create({
      data: {userId: c4.id, notificationsEnabled: true, language: 'ar'},
    }),
    prisma.userPreference.create({
      data: {userId: c5.id, notificationsEnabled: true, language: 'en'},
    }),
  ]);

  // ── Saved Searches and Notifications ──────────────────────────────────────────
  await Promise.all([
    // Saved searches for c1
    prisma.savedSearch.create({
      data: {
        userId: c1.id,
        name: 'Amman Apartments for Rent',
        searchType: 'rent',
        filters: {city: 'Amman', propertyType: 'Apartment', maxPrice: 800},
      },
    }),
    prisma.savedSearch.create({
      data: {
        userId: c1.id,
        name: 'Balanced Investment Opportunities',
        searchType: 'investment',
        filters: {minIrr: 0.13},
      },
    }),
    prisma.savedSearch.create({
      data: {
        userId: c1.id,
        name: 'Sale Homes in Abdali',
        searchType: 'sale',
        filters: {search: 'Abdali', maxPrice: 1200000},
      },
    }),
    // Saved searches for c5
    prisma.savedSearch.create({
      data: {
        userId: c5.id,
        name: 'Amman Villas for Sale',
        searchType: 'sale',
        filters: {city: 'Amman', propertyType: 'Villa', maxPrice: 3000000},
      },
    }),
    prisma.savedSearch.create({
      data: {
        userId: c5.id,
        name: 'Aqaba Investment Opportunities',
        searchType: 'investment',
        filters: {location: 'Aqaba'},
      },
    }),

    // Notifications for c1
    prisma.notification.create({
      data: {
        userId: c1.id,
        type: 'listing_status_change',
        title: 'Your listing was verified',
        body: 'Al Noor Residence Block A has been verified by DLS and is now live on the platform.',
        data: {propertyId: 'seed-property-1'},
        isRead: true,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c1.id,
        type: 'investment_milestone',
        title: 'Abdali Downtown Fund reaches 70% funding',
        body: 'The opportunity you saved has crossed the 70% funding milestone. Act now to secure your position.',
        data: {opportunityId: 'seed-opportunity-1'},
        isRead: true,
        createdAt: new Date('2026-04-03T09:00:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c1.id,
        type: 'new_message',
        title: 'New reply in your thread',
        body: 'An Aqarya representative replied to your inquiry about the sale listing.',
        data: {threadId: 'seed-thread-1'},
        isRead: false,
        createdAt: new Date('2026-04-06T14:30:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c1.id,
        type: 'saved_search_match',
        title: 'New match: Amman Apartments for Rent',
        body: '3 new rental listings match your saved search in Amman.',
        data: {searchType: 'rent', city: 'Amman'},
        isRead: false,
        createdAt: new Date('2026-04-07T08:00:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c1.id,
        type: 'system',
        title: 'Welcome to Aqarya',
        body: 'Your account is fully set up. Start browsing verified listings and investment opportunities.',
        data: Prisma.JsonNull,
        isRead: true,
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
      },
    }),

    // Notifications for c4 (tariq)
    prisma.notification.create({
      data: {
        userId: c4.id,
        type: 'system',
        title: 'Welcome to Aqarya',
        body: 'Your account is fully set up. Start browsing verified listings and investment opportunities.',
        data: Prisma.JsonNull,
        isRead: true,
        createdAt: new Date('2026-03-12T08:30:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c4.id,
        type: 'investment_milestone',
        title: 'Aqaba Marina Fund is 58% funded',
        body: 'An opportunity you simulated is approaching its funding target. Review your simulation.',
        data: {opportunityType: 'property_investment'},
        isRead: false,
        createdAt: new Date('2026-04-05T10:00:00.000Z'),
      },
    }),

    // Notifications for c5 (yousef)
    prisma.notification.create({
      data: {
        userId: c5.id,
        type: 'system',
        title: 'Welcome to Aqarya',
        body: 'Your account is fully set up. Start browsing verified listings and investment opportunities.',
        data: Prisma.JsonNull,
        isRead: true,
        createdAt: new Date('2026-03-08T09:30:00.000Z'),
      },
    }),
    prisma.notification.create({
      data: {
        userId: c5.id,
        type: 'saved_search_match',
        title: 'New match: Amman Villas for Sale',
        body: '2 new sale listings match your saved search for villas in Amman.',
        data: {searchType: 'sale', city: 'Amman'},
        isRead: false,
        createdAt: new Date('2026-04-08T11:00:00.000Z'),
      },
    }),
  ]);

  // ── Moderation: Reports and Quality Flags ─────────────────────────────────────
  const [reportTargetListing1, reportTargetListing2] = await Promise.all([
    prisma.property.findFirst({where: {marketType: 'sale', status: 'verified'}}),
    prisma.property.findFirst({where: {marketType: 'rent', status: 'verified'}}),
  ]);
  const [reportTargetOpp1, reportTargetOpp2] = await Promise.all([
    prisma.investmentOpportunity.findFirst({where: {status: 'published', trustBadge: 'aqarya_approved'}}),
    prisma.investmentOpportunity.findFirst({where: {status: 'published', trustBadge: 'premium_verified'}}),
  ]);

  if (reportTargetListing1 && reportTargetListing2 && reportTargetOpp1 && reportTargetOpp2) {
    await Promise.all([
      prisma.moderationReport.create({
        data: {
          targetType: 'listing',
          targetId: reportTargetListing1.id,
          reporterId: c2.id,
          reason: 'misleading_info',
          notes: 'The property description mentions a private pool but the images show no pool.',
          status: 'open',
          createdAt: new Date('2026-04-01T11:00:00.000Z'),
        },
      }),
      prisma.moderationReport.create({
        data: {
          targetType: 'listing',
          targetId: reportTargetListing2.id,
          reporterId: c3.id,
          reason: 'fraud',
          notes: 'This listing appears to be a duplicate of another property on the platform.',
          status: 'under_review',
          createdAt: new Date('2026-04-02T09:30:00.000Z'),
          reviewedAt: new Date('2026-04-03T10:00:00.000Z'),
          reviewedBy: admin.id,
        },
      }),
      prisma.moderationReport.create({
        data: {
          targetType: 'opportunity',
          targetId: reportTargetOpp1.id,
          reporterId: c1.id,
          reason: 'spam',
          notes: 'Same opportunity was submitted 3 times under slightly different names.',
          status: 'resolved',
          createdAt: new Date('2026-03-28T14:00:00.000Z'),
          reviewedAt: new Date('2026-03-30T16:00:00.000Z'),
          reviewedBy: admin.id,
        },
      }),
      prisma.moderationReport.create({
        data: {
          targetType: 'opportunity',
          targetId: reportTargetOpp2.id,
          reporterId: c3.id,
          reason: 'other',
          notes: 'Not sure about the sponsor credentials.',
          status: 'dismissed',
          createdAt: new Date('2026-03-25T10:00:00.000Z'),
          reviewedAt: new Date('2026-03-26T11:00:00.000Z'),
          reviewedBy: admin.id,
        },
      }),
      prisma.moderationReport.create({
        data: {
          targetType: 'listing',
          targetId: reportTargetListing1.id,
          reporterId: c3.id,
          reason: 'duplicate',
          notes: 'I have seen this exact listing on another platform last week.',
          status: 'open',
          createdAt: new Date('2026-04-05T08:00:00.000Z'),
        },
      }),
    ]);

    await prisma.qualityFlag.createMany({
      data: [
        {
          targetType: 'listing',
          targetId: reportTargetListing1.id,
          rule: 'suspicious_pricing',
          severity: 'medium',
          details: `Price (${reportTargetListing1.price}) is noticeably higher than property value (${reportTargetListing1.propertyValue}).`,
          createdAt: new Date('2026-04-01T11:00:00.000Z'),
        },
        {
          targetType: 'opportunity',
          targetId: reportTargetOpp1.id,
          rule: 'missing_key_data',
          severity: 'low',
          details: 'Opportunity description length is below recommended minimum.',
          createdAt: new Date('2026-03-28T14:00:00.000Z'),
          resolvedAt: new Date('2026-03-30T16:00:00.000Z'),
          resolvedBy: admin.id,
        },
        {
          targetType: 'opportunity',
          targetId: reportTargetOpp2.id,
          rule: 'unrealistic_returns',
          severity: 'medium',
          details: 'Target IRR of 45.0% significantly exceeds typical market benchmarks.',
          createdAt: new Date('2026-03-25T10:00:00.000Z'),
        },
      ],
    });
  }

  // ── CMS: Announcements ────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Platform Maintenance — April 12',
        body: 'Aqarya will undergo scheduled maintenance on April 12 from 2:00 AM to 4:00 AM (AST). Listings and investment browsing will be read-only during this window.',
        type: 'system',
        audience: 'all_citizens',
        status: 'active',
        createdBy: admin.id,
        sentAt: new Date('2026-04-08T09:00:00.000Z'),
        createdAt: new Date('2026-04-08T09:00:00.000Z'),
      },
      {
        title: 'New: Rent Listings Now Live',
        body: 'Aqarya now supports rental property listings across Amman, Zarqa, Aqaba, and Irbid. Browse verified rental properties directly from the Listings tab.',
        type: 'system',
        audience: 'all_citizens',
        status: 'active',
        createdBy: admin.id,
        sentAt: new Date('2026-03-28T10:00:00.000Z'),
        createdAt: new Date('2026-03-28T10:00:00.000Z'),
      },
      {
        title: 'Provider Verification Policy Update',
        body: 'Updated compliance requirements for agency and developer accounts take effect May 1. Please ensure your registration documents are current in your provider profile.',
        type: 'system',
        audience: 'all_providers',
        status: 'active',
        createdBy: admin.id,
        sentAt: new Date('2026-04-05T11:00:00.000Z'),
        createdAt: new Date('2026-04-05T11:00:00.000Z'),
      },
      {
        title: 'Q1 Investment Report Available',
        body: 'The Q1 2026 platform investment activity report is now available. Fractional investment total across all published opportunities reached JOD 4.2M.',
        type: 'investment_milestone',
        audience: 'all_citizens',
        status: 'archived',
        createdBy: admin.id,
        sentAt: new Date('2026-04-01T08:00:00.000Z'),
        archivedAt: new Date('2026-04-07T08:00:00.000Z'),
        createdAt: new Date('2026-04-01T08:00:00.000Z'),
      },
    ],
  });

  // Dispatch system notifications for active all_citizens announcements to all 5 citizens
  const citizenIds = [c1.id, c2.id, c3.id, c4.id, c5.id];
  await prisma.notification.createMany({
    data: [
      ...citizenIds.map(userId => ({
        userId,
        type: 'system' as const,
        title: 'Platform Maintenance — April 12',
        body: 'Aqarya will undergo scheduled maintenance on April 12 from 2:00 AM to 4:00 AM (AST). Listings and investment browsing will be read-only during this window.',
        data: {source: 'announcement'},
        isRead: false,
        createdAt: new Date('2026-04-08T09:00:00.000Z'),
      })),
      ...citizenIds.map(userId => ({
        userId,
        type: 'system' as const,
        title: 'New: Rent Listings Now Live',
        body: 'Aqarya now supports rental property listings across Amman, Zarqa, Aqaba, and Irbid. Browse verified rental properties directly from the Listings tab.',
        data: {source: 'announcement'},
        isRead: true,
        createdAt: new Date('2026-03-28T10:00:00.000Z'),
      })),
    ],
    skipDuplicates: true,
  });

  // ── CMS: Content Blocks (Help/Support) ────────────────────────────────────────
  await prisma.contentBlock.createMany({
    data: [
      {
        key: 'help_intro_title',
        title: 'How Aqarya Works',
        body: 'Aqarya is Jordan\'s trusted property platform. Browse verified sale and rental listings, invest fractionally in income-generating properties, and track your portfolio — all in one place.',
        icon: null,
        order: 0,
        active: true,
      },
      {
        key: 'help_buy',
        title: 'Buying Property',
        body: 'All sale listings on Aqarya are submitted by owners and verified by the Department of Lands and Survey (DLS). Look for the ✓ Verified badge before making any purchase enquiry.',
        icon: '🏠',
        order: 1,
        active: true,
      },
      {
        key: 'help_rent',
        title: 'Renting Property',
        body: 'Rental listings are posted by verified property owners and agencies. Each listing shows the monthly rent, area, and key amenities. Use filters to find your ideal home.',
        icon: '🔑',
        order: 2,
        active: true,
      },
      {
        key: 'help_invest',
        title: 'Fractional Investment',
        body: 'Invest in verified real estate projects by purchasing fractional shares. Each opportunity is reviewed and approved by Aqarya before publishing. Monitor your portfolio under your profile.',
        icon: '◆',
        order: 3,
        active: true,
      },
      {
        key: 'help_trust',
        title: 'Trust & Verification',
        body: 'Aqarya uses a multi-layer verification process combining identity checks, property title verification, and blockchain anchoring. Trust scores and badges reflect the depth of each review.',
        icon: '✓',
        order: 4,
        active: true,
      },
      {
        key: 'help_support',
        title: 'Support & Contact',
        body: 'Questions about a listing, a transaction, or your account? Open a support thread directly from the property detail page, or contact us at support@aqarya.jo.',
        icon: '💬',
        order: 5,
        active: true,
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
