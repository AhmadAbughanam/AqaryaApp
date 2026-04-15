import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {AuditService} from '../audit/audit.service';
import {PrismaService} from '../common/prisma.service';
import {AuthUser} from '../common/auth-user';
import {CreateThreadDto} from './dto/create-thread.dto';
import {SendMessageDto} from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getThreads(userId: string) {
    const threads = await this.prisma.thread.findMany({
      where: {citizenId: userId},
      include: {
        messages: {
          orderBy: {createdAt: 'desc'},
          take: 1,
        },
        _count: {select: {messages: true}},
        listing: {select: {id: true, title: true, marketType: true}},
        opportunity: {select: {id: true, title: true, assetClass: true}},
      },
      orderBy: {updatedAt: 'desc'},
    });

    return threads.map(thread => ({
      id: thread.id,
      subject: thread.subject,
      listingId: thread.listingId,
      listingTitle: thread.listing?.title ?? null,
      listingMarketType: thread.listing?.marketType ?? null,
      opportunityId: thread.opportunityId,
      opportunityTitle: thread.opportunity?.title ?? null,
      opportunityAssetClass: thread.opportunity?.assetClass ?? null,
      lastMessage: thread.messages[0]
        ? {
            body: thread.messages[0].body,
            senderRole: thread.messages[0].senderRole,
            createdAt: thread.messages[0].createdAt.toISOString(),
          }
        : null,
      messageCount: thread._count.messages,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }));
  }

  async createThread(userId: string, dto: CreateThreadDto, user: AuthUser) {
    if (!dto.listingId && !dto.opportunityId) {
      throw new BadRequestException('A thread must reference either a listing or an opportunity.');
    }
    if (dto.listingId && dto.opportunityId) {
      throw new BadRequestException('A thread cannot reference both a listing and an opportunity.');
    }

    if (dto.listingId) {
      const listing = await this.prisma.property.findUnique({where: {id: dto.listingId}});
      if (!listing || !['verified', 'sold'].includes(listing.status)) {
        throw new NotFoundException('Listing not found or not available for enquiry.');
      }
    }

    if (dto.opportunityId) {
      const opp = await this.prisma.investmentOpportunity.findUnique({where: {id: dto.opportunityId}});
      if (!opp || opp.status !== 'published') {
        throw new NotFoundException('Opportunity not found or not available for enquiry.');
      }
    }

    const thread = await this.prisma.$transaction(async tx => {
      const created = await tx.thread.create({
        data: {
          subject: dto.subject,
          citizenId: userId,
          listingId: dto.listingId ?? null,
          opportunityId: dto.opportunityId ?? null,
        },
      });

      await tx.message.create({
        data: {
          threadId: created.id,
          senderId: userId,
          senderRole: 'citizen',
          body: dto.initialMessage,
        },
      });

      return created;
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'thread_created',
      propertyId: dto.listingId,
      metadata: {
        threadId: thread.id,
        subject: dto.subject,
        ...(dto.opportunityId ? {opportunityId: dto.opportunityId} : {}),
      },
    });

    return this.getThreadDetail(thread.id, userId);
  }

  async getThreadDetail(threadId: string, userId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: {id: threadId},
      include: {
        messages: {
          orderBy: {createdAt: 'asc'},
          include: {
            sender: {select: {id: true, username: true}},
          },
        },
        listing: {select: {id: true, title: true, location: true, marketType: true, price: true}},
        opportunity: {select: {id: true, title: true, location: true, assetClass: true, pricePerShare: true}},
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found.');
    }
    if (thread.citizenId !== userId) {
      throw new ForbiddenException('You do not have access to this thread.');
    }

    return {
      id: thread.id,
      subject: thread.subject,
      listing: thread.listing
        ? {
            id: thread.listing.id,
            title: thread.listing.title,
            location: thread.listing.location,
            marketType: thread.listing.marketType,
            price: thread.listing.price,
          }
        : null,
      opportunity: thread.opportunity
        ? {
            id: thread.opportunity.id,
            title: thread.opportunity.title,
            location: thread.opportunity.location,
            assetClass: thread.opportunity.assetClass,
            pricePerShare: thread.opportunity.pricePerShare,
          }
        : null,
      messages: thread.messages.map(msg => ({
        id: msg.id,
        body: msg.body,
        senderId: msg.sender.id,
        senderName: msg.sender.username,
        senderRole: msg.senderRole,
        createdAt: msg.createdAt.toISOString(),
      })),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  async sendMessage(threadId: string, userId: string, dto: SendMessageDto, user: AuthUser) {
    const thread = await this.prisma.thread.findUnique({where: {id: threadId}});
    if (!thread) {
      throw new NotFoundException('Thread not found.');
    }
    if (thread.citizenId !== userId) {
      throw new ForbiddenException('You do not have access to this thread.');
    }

    const message = await this.prisma.$transaction(async tx => {
      const msg = await tx.message.create({
        data: {
          threadId,
          senderId: userId,
          senderRole: 'citizen',
          body: dto.body,
        },
        include: {sender: {select: {id: true, username: true}}},
      });

      await tx.thread.update({
        where: {id: threadId},
        data: {updatedAt: new Date()},
      });

      return msg;
    });

    await this.auditService.log({
      actorId: user.sub,
      actorRole: user.role,
      actionType: 'message_sent',
      metadata: {threadId, messageId: message.id},
    });

    return {
      id: message.id,
      body: message.body,
      senderId: message.sender.id,
      senderName: message.sender.username,
      senderRole: message.senderRole,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
