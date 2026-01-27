import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user profile
   */
  async getMe(userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      username: user.name, // Map name to username for frontend
      active: user.status === 'ACTIVE',
    };
  }

  /**
   * Update current user profile
   */
  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    // Map username to name field
    if (dto.username) {
      updateData.name = dto.username;
    }

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.phone) {
      updateData.phone = dto.phone;
    }

    if (dto.avatarUrl) {
      updateData.avatarUrl = dto.avatarUrl;
    }

    const updated = await this.prisma.userAccount.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        accountId: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      username: updated.name,
      active: updated.status === 'ACTIVE',
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('User does not have a password set');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }
}
