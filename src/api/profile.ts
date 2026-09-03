import {CURRENT_USER, mockDelay, properties, savedPropertyIds} from '../mock/db';
import type {MarketType, VerificationStatus} from './properties';

export interface ProfileAggregateStats {
  ownedPropertyCount: number;
  listedForSaleCount: number;
  soldPropertyCount: number;
  savedCount: number;
  totalOwnedValue: number;
}

export interface UserPreference {
  notificationsEnabled: boolean;
  language: string;
}

export interface OwnedProfileProperty {
  id: string;
  title: string;
  location: string;
  status: VerificationStatus;
  marketType: MarketType;
  propertyValue: number;
  price: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  canListForSale: boolean;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CitizenProfile {
  user: {
    id: string;
    username: string;
    role: 'citizen';
  };
  aggregates: ProfileAggregateStats;
  preference: UserPreference;
  ownedProperties: OwnedProfileProperty[];
}

export const getMyProfile = async (): Promise<CitizenProfile> => {
  await mockDelay();
  const owned = properties.filter(record => record.ownerId === CURRENT_USER.id);
  const ownedProperties: OwnedProfileProperty[] = owned.map(record => ({
    id: record.id,
    title: record.title,
    location: record.location,
    status: record.verificationStatus,
    marketType: record.marketType,
    propertyValue: record.propertyValue,
    price: record.price,
    verificationStatus: record.propertyVerificationStatus,
    identityVerificationStatus: record.identityVerificationStatus,
    canListForSale:
      record.marketType === 'sale' && record.verificationStatus === 'verified',
    imageUrls: record.imageUrls,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  return {
    user: {id: CURRENT_USER.id, username: CURRENT_USER.username, role: 'citizen'},
    aggregates: {
      ownedPropertyCount: ownedProperties.length,
      listedForSaleCount: owned.filter(record => record.marketType === 'sale').length,
      soldPropertyCount: owned.filter(record => record.verificationStatus === 'sold')
        .length,
      savedCount: savedPropertyIds.size,
      totalOwnedValue: owned.reduce((sum, record) => sum + record.propertyValue, 0),
    },
    preference: {notificationsEnabled: true, language: 'en'},
    ownedProperties,
  };
};

export const updatePreferences = async (prefs: {
  notificationsEnabled?: boolean;
  language?: string;
}): Promise<{notificationsEnabled: boolean; language: string}> => {
  await mockDelay(80);
  return {
    notificationsEnabled: prefs.notificationsEnabled ?? true,
    language: prefs.language ?? 'en',
  };
};
