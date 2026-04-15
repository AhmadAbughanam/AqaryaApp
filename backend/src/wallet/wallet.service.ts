import {BadRequestException, Injectable} from '@nestjs/common';
import {randomUUID} from 'crypto';
import {Prisma, WalletTxType, WalletTxStatus} from '@prisma/client';
import {PrismaService} from '../common/prisma.service';
import {DepositDto} from './dto/deposit.dto';
import {WithdrawDto} from './dto/withdraw.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    return this.prisma.wallet.upsert({
      where: {userId},
      create: {userId, ejodBalance: 0, lockedAmount: 0, pendingDeposits: 0},
      update: {},
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      ejodBalance: wallet.ejodBalance,
      pendingDeposits: wallet.pendingDeposits,
      lockedAmount: wallet.lockedAmount,
      availableBalance: Math.max(0, wallet.ejodBalance - wallet.lockedAmount),
      currency: 'JOD' as const,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getOrCreateWallet(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: {walletId: wallet.id},
        orderBy: {createdAt: 'desc'},
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({where: {walletId: wallet.id}}),
    ]);
    return {items, total};
  }

  async requestDeposit(userId: string, dto: DepositDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const reference = `DEP-${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12)}`;

    await this.prisma.$transaction(async tx => {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.deposit,
          amount: dto.amount,
          status: WalletTxStatus.completed,
          description: `Deposit via CliQ: ${dto.cliqAlias}`,
          reference,
        },
      });
      await tx.wallet.update({
        where: {id: wallet.id},
        data: {ejodBalance: {increment: dto.amount}},
      });
    });

    return {reference};
  }

  async requestWithdrawal(userId: string, dto: WithdrawDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const available = wallet.ejodBalance - wallet.lockedAmount;

    if (available < dto.amount) {
      throw new BadRequestException(
        `Insufficient available balance. Available: ${available.toFixed(2)} JOD.`,
      );
    }

    const reference = `WIT-${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12)}`;

    await this.prisma.$transaction(async tx => {
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTxType.withdrawal,
          amount: dto.amount,
          status: WalletTxStatus.pending,
          description: `Withdrawal to CliQ: ${dto.cliqAlias}`,
          reference,
        },
      });
      await tx.wallet.update({
        where: {id: wallet.id},
        data: {ejodBalance: {decrement: dto.amount}},
      });
    });

    return {reference};
  }

  /**
   * Debits the wallet for a purchase inside an external Prisma transaction.
   * Caller is responsible for wrapping this in $transaction if needed.
   */
  async debitInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    type: WalletTxType,
    description: string,
    propertyTitle?: string,
  ): Promise<string> {
    const wallet = await tx.wallet.findUnique({where: {userId}});
    if (!wallet) {
      throw new BadRequestException('Wallet not found. Please open your Ejod Wallet first.');
    }
    const available = wallet.ejodBalance - wallet.lockedAmount;
    if (available < amount) {
      throw new BadRequestException(
        `Insufficient Ejod balance. Available: ${available.toFixed(2)} JOD, required: ${amount.toFixed(2)} JOD.`,
      );
    }

    const reference = `PAY-${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12)}`;

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        status: WalletTxStatus.completed,
        description,
        propertyTitle,
        reference,
      },
    });

    await tx.wallet.update({
      where: {id: wallet.id},
      data: {ejodBalance: {decrement: amount}},
    });

    return reference;
  }
}
