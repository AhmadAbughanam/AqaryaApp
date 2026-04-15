import {Body, Controller, Get, Param, Post, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {Roles} from '../common/decorators/roles.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {AuthUser} from '../common/auth-user';
import {MessagesService} from './messages.service';
import {CreateThreadDto} from './dto/create-thread.dto';
import {SendMessageDto} from './dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('threads')
  @Roles('citizen')
  getThreads(@CurrentUser() user: AuthUser) {
    return this.messagesService.getThreads(user.sub);
  }

  @Post('threads')
  @Roles('citizen')
  createThread(@CurrentUser() user: AuthUser, @Body() dto: CreateThreadDto) {
    return this.messagesService.createThread(user.sub, dto, user);
  }

  @Get('threads/:id')
  @Roles('citizen')
  getThreadDetail(@Param('id') threadId: string, @CurrentUser() user: AuthUser) {
    return this.messagesService.getThreadDetail(threadId, user.sub);
  }

  @Post('threads/:id/messages')
  @Roles('citizen')
  sendMessage(
    @Param('id') threadId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(threadId, user.sub, dto, user);
  }
}
