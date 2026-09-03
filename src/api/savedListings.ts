import {getSecureToken} from '../services/secureStorage';
import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

const isDevToken = (t: string | null) => Boolean(t && t.startsWith('dev-jwt-'));

// ── Dev mock state ────────────────────────────────────────────────────────────
// In-memory store for development sessions. Resets on app reload.

const devSavedIds = new Set<string>();      // property IDs
const devSavedOppIds = new Set<string>();   // opportunity IDs

// Minimal property data mirroring the dev records in properties.ts
const DEV_PROPS: Record<string, {
  title: string; location: string; city: string | null;
  price: number; marketType: string; verificationStatus: string;
  propertyType?: string; bedrooms?: number; bathrooms?: number; areaSqm?: number;
}> = {
  'prop-001': {title: 'Jabal Amman Courtyard House', location: 'Amman, Jabal Amman', city: 'Amman', price: 1550000, marketType: 'sale', verificationStatus: 'verified', propertyType: 'Villa', bedrooms: 4, bathrooms: 3, areaSqm: 280},
  'prop-002': {title: 'Irbid Hillside Villa', location: 'Irbid, University Street', city: 'Irbid', price: 2250000, marketType: 'sale', verificationStatus: 'verified', propertyType: 'Villa', bedrooms: 5, bathrooms: 4, areaSqm: 390},
  'prop-003': {title: 'Sweifieh Modern Apartment', location: 'Amman, Sweifieh', city: 'Amman', price: 600, marketType: 'rent', verificationStatus: 'verified', propertyType: 'Apartment', bedrooms: 2, bathrooms: 2, areaSqm: 130},
  'prop-004': {title: 'University District Villa', location: 'Irbid, University District', city: 'Irbid', price: 480, marketType: 'rent', verificationStatus: 'verified', propertyType: 'Villa', bedrooms: 4, bathrooms: 3, areaSqm: 250},
};

export interface SavedListing {
  id: string;
  type: 'listing' | 'opportunity';
  savedAt: string;
  listing: {
    id: string;
    title: string;
    location: string;
    price: number;
    marketType: string;
    status: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    location: string;
    pricePerShare: number;
    assetClass: string;
    riskBand: string;
    trustBadge: string | null;
    status: string;
  } | null;
}

export interface SaveStatusResponse {
  saved: boolean;
}

export const getSavedItems = async (): Promise<SavedListing[]> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    const now = new Date().toISOString();
    const items: SavedListing[] = [];
    devSavedIds.forEach(id => {
      const p = DEV_PROPS[id];
      items.push({
        id: `saved-${id}`,
        type: 'listing',
        savedAt: now,
        listing: p
          ? {id, title: p.title, location: p.location, price: p.price, marketType: p.marketType, status: p.verificationStatus}
          : {id, title: id, location: '', price: 0, marketType: 'sale', status: 'pending'},
        opportunity: null,
      });
    });
    return items;
  }
  const response = await api.get<SavedListing[]>('/users/me/saved');
  return response.data;
};

export const saveListing = async (propertyId: string): Promise<{id: string; type: string; propertyId: string; savedAt: string}> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    devSavedIds.add(propertyId);
    return {id: `saved-${propertyId}`, type: 'listing', propertyId, savedAt: new Date().toISOString()};
  }
  const response = await api.post('/users/me/saved', {type: 'listing', propertyId});
  return response.data as {id: string; type: string; propertyId: string; savedAt: string};
};

export const saveOpportunity = async (opportunityId: string): Promise<{id: string; type: string; opportunityId: string; savedAt: string}> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    devSavedOppIds.add(opportunityId);
    return {id: `saved-${opportunityId}`, type: 'opportunity', opportunityId, savedAt: new Date().toISOString()};
  }
  const response = await api.post('/users/me/saved', {type: 'opportunity', opportunityId});
  return response.data as {id: string; type: string; opportunityId: string; savedAt: string};
};

export const unsaveListing = async (propertyId: string): Promise<void> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    devSavedIds.delete(propertyId);
    return;
  }
  await api.delete(`/users/me/saved/listing/${propertyId}`);
};

export const unsaveOpportunity = async (opportunityId: string): Promise<void> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    devSavedOppIds.delete(opportunityId);
    return;
  }
  await api.delete(`/users/me/saved/opportunity/${opportunityId}`);
};

export const checkListingSaved = async (propertyId: string): Promise<boolean> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    return devSavedIds.has(propertyId);
  }
  const response = await api.get<SaveStatusResponse>(`/users/me/saved/listing/${propertyId}/status`);
  return response.data.saved;
};

export const checkOpportunitySaved = async (opportunityId: string): Promise<boolean> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    return devSavedOppIds.has(opportunityId);
  }
  const response = await api.get<SaveStatusResponse>(`/users/me/saved/opportunity/${opportunityId}/status`);
  return response.data.saved;
};

export const updatePreferences = async (prefs: {
  notificationsEnabled?: boolean;
  language?: string;
}): Promise<{notificationsEnabled: boolean; language: string}> => {
  const response = await api.put<{notificationsEnabled: boolean; language: string}>(
    '/users/me/preferences',
    prefs,
  );
  return response.data;
};
