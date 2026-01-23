import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContactDto: any) {
    return this.prisma.contact.create({
      data: createContactDto,
      include: {
        inbox: true,
        conversations: true,
      },
    });
  }

  async findAll(params: { inboxId?: string; limit?: number }) {
    const { inboxId, limit } = params;
    return this.prisma.contact.findMany({
      where: inboxId ? { inboxId } : undefined,
      include: {
        inbox: true,
        conversations: {
          include: {
            messages: true,
          },
        },
      },
      take: limit,
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        inbox: true,
        conversations: {
          include: {
            messages: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(id: string, updateContactDto: any) {
    return this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
      include: {
        inbox: true,
        conversations: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.contact.delete({
      where: { id },
    });
  }
}
