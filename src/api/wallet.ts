// Ejod smart wallet API — JOD-pegged stablecoin embedded in user profile.
// Deposit via CliQ (JOD → Ejod), withdraw via CliQ payout (Ejod → JOD).
// Shown on Buy / Rent / Invest payment pages and in the profile wallet screen.

import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'purchase'
  | 'rent_payment'
  | 'investment'
  | 'dividend'
  | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface WalletBalance {
  ejodBalance: number;        // Ejod (JOD-pegged stablecoin)
  pendingDeposits: number;    // Awaiting CliQ confirmation
  lockedAmount: number;       // Locked in active escrows / installment plans
  availableBalance: number;   // ejodBalance - lockedAmount
  currency: 'JOD';
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  propertyTitle?: string;
  createdAt: string;
}

export interface DepositRequest {
  amount: number;
  cliqAlias: string;          // User's CliQ alias or IBAN
}

export interface WithdrawRequest {
  amount: number;
  cliqAlias: string;          // Destination CliQ alias or IBAN
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const getWalletBalance = async (): Promise<WalletBalance> => {
  const res = await api.get<WalletBalance>('/wallet/balance');
  return res.data;
};

export const getTransactionHistory = async (
  page = 1,
  limit = 20,
): Promise<{items: WalletTransaction[]; total: number}> => {
  const res = await api.get<{items: WalletTransaction[]; total: number}>(
    '/wallet/transactions',
    {params: {page, limit}},
  );
  return res.data;
};

export const requestDeposit = async (body: DepositRequest): Promise<{reference: string}> => {
  const res = await api.post<{reference: string}>('/wallet/deposit', body);
  return res.data;
};

export const requestWithdrawal = async (body: WithdrawRequest): Promise<{reference: string}> => {
  const res = await api.post<{reference: string}>('/wallet/withdraw', body);
  return res.data;
};
