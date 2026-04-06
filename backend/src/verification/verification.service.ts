import {Injectable} from '@nestjs/common';
import {createHash, randomUUID} from 'crypto';

interface SubmissionRecordInput {
  ownerId?: string | null;
  sellerUsername: string;
  title: string;
  location: string;
  ownerName: string;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  description: string;
  imageUrls: string[];
  price: number;
  propertyValue: number;
  totalShares: number;
}

@Injectable()
export class VerificationService {
  private readonly provider =
    process.env.BLOCKCHAIN_PROVIDER?.trim() || 'mock-chain';

  private readonly network =
    process.env.BLOCKCHAIN_NETWORK?.trim() || 'local-simnet';

  private readonly recordPrefix =
    process.env.BLOCKCHAIN_RECORD_PREFIX?.trim() || 'aqarya-vrf';

  verifySubmission(input: SubmissionRecordInput) {
    const normalizedProof = input.ownershipProofNumber.trim().toUpperCase();
    const normalizedSeller = input.sellerUsername.trim().toUpperCase();
    const normalizedOwnerName = input.ownerName.trim().toUpperCase();
    const documentPrefix = input.ownershipProofType
      .split(/[^a-zA-Z]/)
      .filter(Boolean)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');

    const consistencyChecks = {
      hasPositivePrice: input.price > 0,
      hasReasonableValuation: input.propertyValue > 0 && input.price >= input.propertyValue * 0.5,
      hasValidShareSplit: input.totalShares > 0 && Number.isInteger(input.totalShares),
      hasDescription: input.description.trim().length >= 20,
      hasOwnershipDocument: normalizedProof.length >= 5,
    };

    const ownershipSignals = {
      proofContainsSellerHint:
        normalizedProof.includes(normalizedSeller.slice(0, 3)) ||
        normalizedProof.startsWith(documentPrefix),
      ownerNamePresent: normalizedOwnerName.length >= 5,
      ownerLinkedToAccount: Boolean(input.ownerId),
    };

    const listingConsistent = Object.values(consistencyChecks).every(Boolean);
    const ownershipProofMatches =
      ownershipSignals.ownerLinkedToAccount &&
      ownershipSignals.ownerNamePresent &&
      ownershipSignals.proofContainsSellerHint;

    const payload = JSON.stringify({
      provider: this.provider,
      network: this.network,
      title: input.title,
      location: input.location,
      ownerName: input.ownerName,
      ownershipType: input.ownershipType,
      ownershipProofType: input.ownershipProofType,
      ownershipProofNumber: normalizedProof,
      description: input.description,
      imageUrls: [...input.imageUrls].sort(),
      price: input.price,
      propertyValue: input.propertyValue,
      totalShares: input.totalShares,
      checks: {
        consistencyChecks,
        ownershipSignals,
      },
    });

    return {
      verificationRecordId: `${this.recordPrefix}-${randomUUID()}`,
      blockchainHash: `0x${createHash('sha256').update(payload).digest('hex')}`,
      blockchainStatus: listingConsistent && ownershipProofMatches ? 'pending' as const : 'failed' as const,
      propertyVerificationStatus: listingConsistent ? 'pending' as const : 'rejected' as const,
      identityVerificationStatus: ownershipProofMatches ? 'pending' as const : 'rejected' as const,
      listingConsistent,
      ownershipProofMatches,
      verificationPayload: {
        provider: this.provider,
        network: this.network,
        executedAt: new Date().toISOString(),
        consistencyChecks,
        ownershipSignals,
      },
    };
  }

  buildAnchorRecord(propertyId: string, blockchainHash: string, actorId: string) {
    const anchoredAt = new Date();
    const blockchainTxId = `0x${createHash('sha256')
      .update(`${propertyId}:${blockchainHash}:${actorId}:${anchoredAt.toISOString()}`)
      .digest('hex')}`;

    return {
      blockchainTxId,
      anchoredAt,
      blockchainStatus: 'anchored' as const,
    };
  }
}
