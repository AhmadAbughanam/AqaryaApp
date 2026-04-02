import {ApiError, createAuthenticatedApiClient} from './client';
import {getSecureToken} from '../services/secureStorage';
import {MarketType, VerificationStatus} from './properties';

const investmentsApi = createAuthenticatedApiClient();

export interface PilotProperty {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  propertyValue: number;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  marketType: MarketType;
  verificationStatus: VerificationStatus;
  sponsorName: string;
  assetClass: string;
  stage: string;
  riskBand: string;
  fundingProgress: number;
  targetHoldYears: number;
  targetIrr: number;
  targetCashYield: number;
  occupancyRate: number;
  minimumShares: number;
  minimumInvestmentAmount: number;
  distributionFrequency: string;
}

export interface SimulateInvestmentRequest {
  propertyId: string;
  shares: number;
  holdingPeriodYears?: number;
  exitScenario?: 'conservative' | 'base' | 'optimistic';
  reinvestDistributions?: boolean;
}

export interface SimulationResult {
  simulationId: string;
  propertyId: string;
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
  exitScenario: 'conservative' | 'base' | 'optimistic';
  reinvestDistributions: boolean;
  targetIrr: number;
  targetCashYield: number;
  distributionFrequency: string;
  sponsorName: string;
  riskBand: string;
  createdAt: string;
}

export interface PortfolioItem extends SimulationResult {
  propertyTitle: string;
  location: string;
  propertyStatus: VerificationStatus;
  propertyMarketType?: MarketType;
  annualIncomeEstimate?: number;
  projectedEquityMultiple?: number;
  projectProfile?: {
    assetClass: string;
    stage: string;
    sponsorName: string;
    riskBand: string;
    targetHoldYears: number;
    targetIrr: number;
    targetCashYield: number;
    appreciationRate: number;
    occupancyRate: number;
    managementFeeRate: number;
    minimumShares: number;
    fundingProgress: number;
    distributionFrequency: string;
  };
}

interface Envelope<T> {
  data?: T;
  items?: T;
}

const isDevSessionToken = (token: string | null): boolean =>
  Boolean(token && token.startsWith('dev-jwt-'));

const unwrap = <T>(payload: T | Envelope<T>): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Envelope<T>) &&
    (payload as Envelope<T>).data !== undefined
  ) {
    return (payload as Envelope<T>).data as T;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in (payload as Envelope<T>) &&
    (payload as Envelope<T>).items !== undefined
  ) {
    return (payload as Envelope<T>).items as T;
  }

  return payload as T;
};

let devPilotProperties: PilotProperty[] = [
  {
    id: 'prop-001',
    title: 'Shmeisani Residency Project',
    location: 'Amman, Shmeisani',
    description: 'A verified residential project open for fractional investment simulation.',
    price: 1500000,
    propertyValue: 1450000,
    totalShares: 10000,
    availableShares: 2800,
    pricePerShare: 150,
    marketType: 'investment',
    verificationStatus: 'verified',
    sponsorName: 'Aqarya Capital',
    assetClass: 'Residential',
    stage: 'Operational',
    riskBand: 'Balanced',
    fundingProgress: 0.74,
    targetHoldYears: 5,
    targetIrr: 0.14,
    targetCashYield: 0.078,
    occupancyRate: 0.94,
    minimumShares: 25,
    minimumInvestmentAmount: 3750,
    distributionFrequency: 'Quarterly',
  },
  {
    id: 'prop-002',
    title: 'Irbid Commercial Project',
    location: 'Irbid, Al-Husn Road',
    description: 'Retail and logistics hub suitable for partial investment simulation.',
    price: 2400000,
    propertyValue: 2350000,
    totalShares: 12000,
    availableShares: 6100,
    pricePerShare: 200,
    marketType: 'investment',
    verificationStatus: 'verified',
    sponsorName: 'Northern Gate Sponsors',
    assetClass: 'Commercial',
    stage: 'Lease-up',
    riskBand: 'Moderate',
    fundingProgress: 0.62,
    targetHoldYears: 6,
    targetIrr: 0.16,
    targetCashYield: 0.085,
    occupancyRate: 0.87,
    minimumShares: 40,
    minimumInvestmentAmount: 8000,
    distributionFrequency: 'Quarterly',
  },
  {
    id: 'prop-003',
    title: 'Aqaba Marina Growth Fund',
    location: 'Aqaba, Marina Zone',
    description: 'Hospitality and waterfront retail project seeded for investment browsing.',
    price: 3180000,
    propertyValue: 3100000,
    totalShares: 15000,
    availableShares: 9400,
    pricePerShare: 212,
    marketType: 'investment',
    verificationStatus: 'verified',
    sponsorName: 'Red Sea Ventures',
    assetClass: 'Hospitality',
    stage: 'Stabilizing',
    riskBand: 'Growth',
    fundingProgress: 0.58,
    targetHoldYears: 5,
    targetIrr: 0.18,
    targetCashYield: 0.082,
    occupancyRate: 0.81,
    minimumShares: 35,
    minimumInvestmentAmount: 7420,
    distributionFrequency: 'Semi-annual',
  },
  {
    id: 'prop-004',
    title: 'Madaba Mixed Use Project',
    location: 'Madaba, Ring Road',
    description: 'Growth-stage mixed-use development with available units for simulation.',
    price: 1980000,
    propertyValue: 1940000,
    totalShares: 9000,
    availableShares: 9000,
    pricePerShare: 220,
    marketType: 'investment',
    verificationStatus: 'verified',
    sponsorName: 'Heritage Development Partners',
    assetClass: 'Mixed use',
    stage: 'Development',
    riskBand: 'Growth',
    fundingProgress: 0.46,
    targetHoldYears: 7,
    targetIrr: 0.19,
    targetCashYield: 0.072,
    occupancyRate: 0.78,
    minimumShares: 50,
    minimumInvestmentAmount: 11000,
    distributionFrequency: 'Semi-annual',
  },
];

const devPortfolioByUser: Record<string, PortfolioItem[]> = {};

const parseDevUserId = (token: string): string => {
  const segments = token.split('-');
  return segments.length >= 3 ? segments[2] : 'citizen';
};

export const getPilotProperties = async (search?: string): Promise<PilotProperty[]> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    if (!search?.trim()) {
      return devPilotProperties;
    }

    const query = search.trim().toLowerCase();
    return devPilotProperties.filter(
      property =>
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query),
    );
  }

  const response = await investmentsApi.get<PilotProperty[] | Envelope<PilotProperty[]>>(
    '/investments/pilot-properties',
    {
      params: {search},
    },
  );

  return unwrap<PilotProperty[]>(response.data);
};

export const simulateInvestment = async (
  payload: SimulateInvestmentRequest,
): Promise<SimulationResult> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const property = devPilotProperties.find(
      pilotProperty => pilotProperty.id === payload.propertyId,
    );

    if (!property) {
      throw new ApiError('Selected property is not available.', 404);
    }

    if (!Number.isInteger(payload.shares) || payload.shares <= 0) {
      throw new ApiError('Shares must be a whole number greater than zero.', 400);
    }

    if (payload.shares > property.availableShares) {
      throw new ApiError('Requested shares exceed available shares.', 400);
    }

    property.availableShares -= payload.shares;

    const subtotal = payload.shares * property.pricePerShare;
    const platformFee = Number((subtotal * 0.015).toFixed(2));
    const governmentFee = Number((subtotal * 0.0075).toFixed(2));
    const holdingPeriodYears = payload.holdingPeriodYears ?? property.targetHoldYears;
    const exitScenario = payload.exitScenario ?? 'base';
    const reinvestDistributions = payload.reinvestDistributions ?? false;
    const scenarioFactor =
      exitScenario === 'optimistic' ? 1.08 : exitScenario === 'conservative' ? 0.88 : 1;
    const annualGrossIncome = Number(
      (subtotal * property.targetCashYield * property.occupancyRate * scenarioFactor).toFixed(2),
    );
    const annualManagementFee = Number((subtotal * 0.0125).toFixed(2));
    const annualNetCashFlow = Number((annualGrossIncome - annualManagementFee).toFixed(2));
    const appreciationFactor =
      exitScenario === 'optimistic' ? 1.15 : exitScenario === 'conservative' ? 0.8 : 1;
    const projectedExitValue = Number(
      (subtotal * Math.pow(1 + 0.06 * appreciationFactor, holdingPeriodYears)).toFixed(2),
    );
    const exitFee = Number((projectedExitValue * 0.01).toFixed(2));
    const projectedNetExitProceeds = Number((projectedExitValue - exitFee).toFixed(2));
    const projectedDistributions = Number(
      (annualNetCashFlow * holdingPeriodYears * (reinvestDistributions ? 1.12 : 1)).toFixed(2),
    );
    const projectedProfit = Number(
      (projectedNetExitProceeds + projectedDistributions - subtotal - platformFee - governmentFee).toFixed(2),
    );
    const equityMultiple = Number(
      ((projectedNetExitProceeds + projectedDistributions) / (subtotal + platformFee + governmentFee)).toFixed(2),
    );

    const simulation: SimulationResult = {
      simulationId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      propertyId: payload.propertyId,
      sharesOwned: payload.shares,
      pricePerShare: property.pricePerShare,
      subtotal,
      platformFee,
      governmentFee,
      totalAmount: Number((subtotal + platformFee + governmentFee).toFixed(2)),
      simulatedValue: subtotal,
      expectedAnnualReturn: annualNetCashFlow,
      expectedFiveYearReturn: Number((annualNetCashFlow * 5 + subtotal * 0.32).toFixed(2)),
      ownershipPercentage: (payload.shares / property.totalShares) * 100,
      annualGrossIncome,
      annualManagementFee,
      annualNetCashFlow,
      exitFee,
      projectedExitValue,
      projectedNetExitProceeds,
      projectedProfit,
      equityMultiple,
      holdingPeriodYears,
      exitScenario,
      reinvestDistributions,
      targetIrr: property.targetIrr,
      targetCashYield: property.targetCashYield,
      distributionFrequency: property.distributionFrequency,
      sponsorName: property.sponsorName,
      riskBand: property.riskBand,
      createdAt: new Date().toISOString(),
    };

    const userId = parseDevUserId(token);
    const existingPortfolio = devPortfolioByUser[userId] ?? [];

    devPortfolioByUser[userId] = [
      {
        ...simulation,
        propertyTitle: property.title,
        location: property.location,
        propertyStatus: property.availableShares === 0 ? 'sold' : 'verified',
        propertyMarketType: property.marketType,
        annualIncomeEstimate: simulation.annualNetCashFlow,
        projectedEquityMultiple: simulation.equityMultiple,
        projectProfile: {
          assetClass: property.assetClass,
          stage: property.stage,
          sponsorName: property.sponsorName,
          riskBand: property.riskBand,
          targetHoldYears: property.targetHoldYears,
          targetIrr: property.targetIrr,
          targetCashYield: property.targetCashYield,
          appreciationRate: 0.06,
          occupancyRate: property.occupancyRate,
          managementFeeRate: 0.0125,
          minimumShares: property.minimumShares,
          fundingProgress: property.fundingProgress,
          distributionFrequency: property.distributionFrequency,
        },
      },
      ...existingPortfolio,
    ];

    return simulation;
  }

  const response = await investmentsApi.post<
    SimulationResult | Envelope<SimulationResult>
  >('/investments/simulate', payload);

  return unwrap<SimulationResult>(response.data);
};

export const getPortfolio = async (): Promise<PortfolioItem[]> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const userId = parseDevUserId(token);
    return devPortfolioByUser[userId] ?? [];
  }

  const response = await investmentsApi.get<PortfolioItem[] | Envelope<PortfolioItem[]>>(
    '/investments/portfolio',
  );

  return unwrap<PortfolioItem[]>(response.data);
};
