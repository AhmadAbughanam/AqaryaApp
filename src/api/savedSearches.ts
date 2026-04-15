import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

export interface SavedSearchFilters {
  search?: string;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  minIrr?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  searchType: 'sale' | 'rent' | 'investment';
  filters: SavedSearchFilters;
  createdAt: string;
}

export const getSavedSearches = async (): Promise<SavedSearch[]> => {
  const response = await api.get<SavedSearch[]>('/users/me/saved-searches');
  return response.data;
};

export const createSavedSearch = async (payload: {
  name: string;
  searchType: 'sale' | 'rent' | 'investment';
  filters: SavedSearchFilters;
}): Promise<SavedSearch> => {
  const response = await api.post<SavedSearch>('/users/me/saved-searches', payload);
  return response.data;
};

export const deleteSavedSearch = async (id: string): Promise<void> => {
  await api.delete(`/users/me/saved-searches/${id}`);
};
