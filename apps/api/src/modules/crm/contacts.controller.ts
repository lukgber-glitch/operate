import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients/:clientId/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async create(
    @Req() req: any,
    @Param('clientId') clientId: string,
    @Body() createContactDto: CreateContactDto
  ) {
    const orgId = req.user.orgId;
    return this.contactsService.create(clientId, orgId, createContactDto);
  }

  @Get()
  async findAll(@Req() req: any, @Param('clientId') clientId: string) {
    const orgId = req.user.orgId;
    return this.contactsService.findAllByClient(clientId, orgId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.contactsService.findOne(id, orgId);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto
  ) {
    const orgId = req.user.orgId;
    return this.contactsService.update(id, orgId, updateContactDto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.contactsService.remove(id, orgId);
  }

  @Post(':id/set-primary')
  async setPrimary(@Req() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.contactsService.setPrimary(id, orgId);
  }
}
