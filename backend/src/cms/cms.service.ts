import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../common/prisma.service';
import {AuthUser} from '../common/auth-user';
import {CreateAnnouncementDto} from './dto/create-announcement.dto';
import {UpsertContentBlockDto} from './dto/upsert-content-block.dto';
import {GetAnnouncementsDto} from './dto/get-announcements.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Announcements ────────────────────────────────────────────────────────────

  async createAnnouncement(dto: CreateAnnouncementDto, admin: AuthUser) {
    if (dto.audience === 'one_user') {
      if (!dto.targetUserId) {
        throw new BadRequestException('targetUserId is required when audience is one_user.');
      }
      const target = await this.prisma.user.findUnique({where: {id: dto.targetUserId}});
      if (!target) {
        throw new NotFoundException('Target user not found.');
      }
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        type: dto.type,
        audience: dto.audience,
        targetUserId: dto.audience === 'one_user' ? dto.targetUserId : null,
        createdBy: admin.sub,
        sentAt: new Date(),
      },
    });

    // Dispatch Notification records to targeted users
    await this.dispatchNotifications(announcement.id, dto);

    return this.mapAnnouncement(announcement);
  }

  async getAnnouncements(dto: GetAnnouncementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = dto.status ? {status: dto.status} : {};

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({where}),
    ]);

    return {
      items: items.map(a => this.mapAnnouncement(a)),
      total,
      page,
      limit,
    };
  }

  async archiveAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({where: {id}});
    if (!announcement) {
      throw new NotFoundException('Announcement not found.');
    }
    if (announcement.status === 'archived') {
      return this.mapAnnouncement(announcement);
    }

    const updated = await this.prisma.announcement.update({
      where: {id},
      data: {status: 'archived', archivedAt: new Date()},
    });

    return this.mapAnnouncement(updated);
  }

  getActiveAnnouncementCount() {
    return this.prisma.announcement.count({where: {status: 'active'}});
  }

  // ─── Content Blocks ───────────────────────────────────────────────────────────

  async upsertContentBlock(key: string, dto: UpsertContentBlockDto, admin: AuthUser) {
    const block = await this.prisma.contentBlock.upsert({
      where: {key},
      update: {
        title: dto.title,
        body: dto.body,
        icon: dto.icon,
        ...(dto.order !== undefined ? {order: dto.order} : {}),
        ...(dto.active !== undefined ? {active: dto.active} : {}),
        updatedBy: admin.sub,
      },
      create: {
        key,
        title: dto.title,
        body: dto.body,
        icon: dto.icon,
        order: dto.order ?? 0,
        active: dto.active ?? true,
        updatedBy: admin.sub,
      },
    });

    return this.mapContentBlock(block);
  }

  async getAllContentBlocks() {
    const blocks = await this.prisma.contentBlock.findMany({
      orderBy: [{order: 'asc'}, {key: 'asc'}],
    });
    return blocks.map(b => this.mapContentBlock(b));
  }

  async getActiveContentBlocks() {
    const blocks = await this.prisma.contentBlock.findMany({
      where: {active: true},
      orderBy: [{order: 'asc'}, {key: 'asc'}],
    });
    return blocks.map(b => this.mapContentBlock(b));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async dispatchNotifications(announcementId: string, dto: CreateAnnouncementDto) {
    let userIds: string[] = [];

    if (dto.audience === 'all_citizens') {
      const users = await this.prisma.user.findMany({
        where: {role: 'citizen'},
        select: {id: true},
      });
      userIds = users.map(u => u.id);
    } else if (dto.audience === 'all_providers') {
      const profiles = await this.prisma.providerProfile.findMany({
        select: {userId: true},
      });
      userIds = profiles.map(p => p.userId);
    } else if (dto.audience === 'one_user' && dto.targetUserId) {
      userIds = [dto.targetUserId];
    }

    if (userIds.length === 0) return;

    await this.prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: {announcementId},
      })),
      skipDuplicates: true,
    });
  }

  private mapAnnouncement(a: {
    id: string;
    title: string;
    body: string;
    type: string;
    audience: string;
    targetUserId: string | null;
    status: string;
    createdBy: string;
    createdAt: Date;
    sentAt: Date | null;
    archivedAt: Date | null;
  }) {
    return {
      id: a.id,
      title: a.title,
      body: a.body,
      type: a.type,
      audience: a.audience,
      targetUserId: a.targetUserId,
      status: a.status,
      createdBy: a.createdBy,
      createdAt: a.createdAt.toISOString(),
      sentAt: a.sentAt?.toISOString() ?? null,
      archivedAt: a.archivedAt?.toISOString() ?? null,
    };
  }

  private mapContentBlock(b: {
    id: string;
    key: string;
    title: string;
    body: string;
    icon: string | null;
    order: number;
    active: boolean;
    updatedAt: Date;
    updatedBy: string | null;
  }) {
    return {
      id: b.id,
      key: b.key,
      title: b.title,
      body: b.body,
      icon: b.icon,
      order: b.order,
      active: b.active,
      updatedAt: b.updatedAt.toISOString(),
      updatedBy: b.updatedBy,
    };
  }
}
