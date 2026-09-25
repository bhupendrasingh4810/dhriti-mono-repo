import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma, UserStatus } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { SessionService } from "../auth/services/session.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";

const userDetailSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  status: true,
  role: true,
  isPlatformUser: true,
  onboardingProfile: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      phoneNumber: true,
      bio: true,
      jobTitle: true,
      department: true,
      timezone: true,
      locale: true,
    },
  },
  memberships: {
    select: {
      id: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UserDetail = Prisma.UserGetPayload<{
  select: typeof userDetailSelect;
}>;

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserSummary = Prisma.UserGetPayload<{
  select: typeof userSummarySelect;
}>;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async findAllActiveUsers(): Promise<UserSummary[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: userSummarySelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async createUser(dto: CreateUserDto): Promise<UserDetail> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(
        ErrorCode.EMAIL_ALREADY_REGISTERED,
        "A user with this email already exists",
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
        role: dto.role,
      },
      select: userDetailSelect,
    });
  }

  async findActiveUserById(userId: string): Promise<UserDetail> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: userDetailSelect,
    });

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<UserDetail> {
    await this.findActiveUserById(userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: userDetailSelect,
    });

    if (dto.status && this.revokesSessions(dto.status)) {
      await this.sessions.revokeAllUserSessions(userId);
    }

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.findActiveUserById(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: "DELETED" },
    });
    await this.sessions.revokeAllUserSessions(userId);
  }

  private revokesSessions(status: UserStatus): boolean {
    return status !== "ACTIVE" && status !== "PENDING_VERIFICATION";
  }
}
