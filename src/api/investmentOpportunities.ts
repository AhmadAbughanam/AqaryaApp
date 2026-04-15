import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

export type TrustBadgeTier = 'verified' | 'premium_verified' | 'aqarya_approved';
export type InvestmentOpportunityStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'rejected';

export type ExitScenario = 'conservative' | 'base' | 'optimistic';

export interface InvestmentOpportunityListItem {
  id: string;
  title: string;
  location: string;
  assetClass: string;
  stage: string;
  sponsorName: string;
  riskBand: string;
  targetIrr: number;
  targetCashYield: number;
  targetHoldYears: number;
  pricePerShare: number;
  minimumShares: number;
  minimumInvestmentAmount: number;
  fundingGoal: number;
  fundedAmount: number;
  fundingProgress: number;
  trustScore: number | null;
  trustBadge: TrustBadgeTier | null;
  status: InvestmentOpportunityStatus;
  publishedAt: string | null;
  createdAt: string;
}

export interface InvestmentOpportunityDetail extends InvestmentOpportunityListItem {
  description: string;
  imageUrls: string[];
  ownershipStructure: string;
  distributionModel: string;
  exitModel: string;
  totalShares: number;
  availableShares: number;
  appreciationRate: number;
  occupancyRate: number;
  managementFeeRate: number;
  verificationRecordId: string | null;
  blockchainHash: string | null;
  blockchainTxId: string | null;
  blockchainStatus: string;
  anchoredAt: string | null;
}

export interface GetOpportunitiesParams {
  assetClass?: string;
  riskBand?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetOpportunitiesResponse {
  items: InvestmentOpportunityListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SimulateOpportunityRequest {
  opportunityId: string;
  shares: number;
  holdingPeriodYears?: number;
  exitScenario?: ExitScenario;
  reinvestDistributions?: boolean;
}

export interface OpportunitySimulationResult {
  simulationId: string;
  opportunityId: string;
  sharesOwned: number;
  pricePerShare: number;
  subtotal: number;
  platformFee: number;
  governmentFee: number;
  totalAmount: number;
  simulatedValue: number;
  expectedAnnualReturn: number;
  expectedFiveYearReturn: number;
  ownershipPercentage: number;
  annualGrossIncome: number;
  annualManagementFee: number;
  annualNetCashFlow: number;
  exitFee: number;
  projectedExitValue: number;
  projectedNetExitProceeds: number;
  projectedProfit: number;
  equityMultiple: number;
  holdingPeriodYears: number;
  exitScenario: ExitScenario;
  reinvestDistributions: boolean;
  targetIrr: number;
  targetCashYield: number;
  distributionFrequency: string;
  sponsorName: string;
  riskBand: string;
  opportunityTitle: string;
  assetClass: string;
  trustScore: number | null;
  trustBadge: TrustBadgeTier | null;
  createdAt: string;
}

export interface OpportunityPortfolioItem extends OpportunitySimulationResult {
  opportunityTitle: string;
  location: string;
  opportunityStatus: InvestmentOpportunityStatus;
  stage: string;
  targetHoldYears: number;
  distributionFrequency: string;
  annualIncomeEstimate: number;
  projectedEquityMultiple: number;
}

export const getOpportunities = async (
  params: GetOpportunitiesParams = {},
): Promise<GetOpportunitiesResponse> => {
  const parts: string[] = [];
  if (params.assetClass) parts.push(`assetClass=${encodeURIComponent(params.assetClass)}`);
  if (params.riskBand) parts.push(`riskBand=${encodeURIComponent(params.riskBand)}`);
  if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.page) parts.push(`page=${params.page}`);
  if (params.limit) parts.push(`limit=${params.limit}`);

  const qs = parts.join('&');
  const response = await api.get<GetOpportunitiesResponse>(
    `/investments/opportunities${qs ? `?${qs}` : ''}`,
  );
  return response.data;
};

export const getOpportunityDetail = async (id: string): Promise<InvestmentOpportunityDetail> => {
  const response = await api.get<InvestmentOpportunityDetail>(
    `/investments/opportunities/${id}`,
  );
  return response.data;
};

export const simulateOpportunityInvestment = async (
  params: SimulateOpportunityRequest,
): Promise<OpportunitySimulationResult> => {
  const response = await api.post<OpportunitySimulationResult>(
    '/investments/opportunities/simulate',
    params,
  );
  return response.data;
};

export const getOpportunityPortfolio = async (): Promise<OpportunityPortfolioItem[]> => {
  const response = await api.get<OpportunityPortfolioItem[]>(
    '/investments/opportunities-portfolio',
  );
  return response.data;
};

export interface InvestWithWalletRequest {
  shares: number;
  holdingPeriodYears?: number;
  exitScenario?: 'conservative' | 'base' | 'optimistic';
  reinvestDistributions?: boolean;
}

export const investOpportunityWithWallet = async (
  opportunityId: string,
  params: InvestWithWalletRequest,
): Promise<OpportunitySimulationResult & {message: string}> => {
  const response = await api.post<OpportunitySimulationResult & {message: string}>(
    `/investments/opportunities/${opportunityId}/invest-with-wallet`,
    params,
  );
  return response.data;
};
