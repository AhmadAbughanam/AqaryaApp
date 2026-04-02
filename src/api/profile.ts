import {createAuthenticatedApiClient} from './client';
import {MarketType, VerificationStatus} from './properties';

const usersApi = createAuthenticatedApiClient();

export interface ProfileAggregateStats {
  ownedPropertyCount: number;
  salePropertyCount: number;
  investmentProjectCount: number;
  listedForSaleCount: number;
  soldPropertyCount: number;
  investmentCount: number;
  totalOwnedValue: number;
  totalInvested: number;
}

export interface OwnedProfileProperty {
  id: string;
  title: string;
  location: string;
  status: VerificationStatus;
  marketType: MarketType;
  propertyValue: number;
  price: number;
  availableShares: number;
  totalShares: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  canListForSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInvestment {
  simulationId: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyStatus: VerificationStatus;
  propertyMarketType: MarketType;
  sharesOwned: number;
  totalAmount: number;
  expectedAnnualReturn: number;
  expectedFiveYearReturn: number;
  createdAt: string;
}

export interface CitizenProfile {
  user: {
    id: string;
    username: string;
    role: 'citizen';
  };
  aggregates: ProfileAggregateStats;
  ownedProperties: OwnedProfileProperty[];
  investments: ProfileInvestment[];
}

interface Envelope<T> {
  data?: T;
}

export const getMyProfile = async (): Promise<CitizenProfile> => {
  const response = await usersApi.get<CitizenProfile | Envelope<CitizenProfile>>(
    '/users/me/profile',
  );

  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in (response.data as Envelope<CitizenProfile>) &&
    (response.data as Envelope<CitizenProfile>).data
  ) {
    return (response.data as Envelope<CitizenProfile>).data as CitizenProfile;
  }

  return response.data as CitizenProfile;
};
