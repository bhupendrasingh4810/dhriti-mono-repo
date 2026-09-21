import { HttpStatus, Injectable } from "@nestjs/common";
import type { User, UserAuth, UserProfile } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";

import type { UpdateProfileDto, UserProfileResponse } from "../dto/profile.dto";
import type { OrganizationResponse } from "../dto/auth-response.dto";


type UserWithRelations = User & { auth: UserAuth | null; profile: UserProfile | null };

const withAuth = { auth: true } as const;
const withAuthAndProfile = { auth: true, profile: true } as const;

@Injectable()
export class ProfileService {

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Retrieves the profile of the specified user.
   * @param userId The ID of the user whose profile is being retrieved.
   * @returns The user's profile information.
   * @throws AppError if the user does not exist.
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.requireUser(userId);
    const organization = await this.resolveDefaultOrganization(userId);
    return this.toProfile(user, organization);
  }

  /**
   * Updates the profile of the specified user.
   * @param userId The ID of the user whose profile is being updated.
   * @param dto The profile update data transfer object.
   * @returns The updated user's profile information.
   * @throws AppError if the user does not exist.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileResponse> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    if (dto.timezone !== undefined || dto.locale !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        },
        update: {
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        },
      });
    }
    const user = await this.requireUser(userId);
    const organization = await this.resolveDefaultOrganization(userId);
    return this.toProfile(user, organization);
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /**
   * Resolves the default organization for the specified user.
   * @param userId The ID of the user.
   * @returns The user's default organization details, or null if none exists.
   */
  private async resolveDefaultOrganization(userId: string): Promise<OrganizationResponse | null> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, organization: { deletedAt: null } },
      orderBy: { createdAt: "asc" },
      select: { organization: { select: { id: true, name: true, slug: true } } },
    });
    return membership?.organization ?? null;
  }

  /**
   * Retrieves the user with the specified ID, throwing an error if the user does not exist or has been deleted.
   * @param userId The ID of the user to retrieve.
   * @returns The user with the specified ID.
   * @throws AppError if the user is not found or has been deleted.
   */
  private async requireUser(userId: string): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: withAuthAndProfile,
    });
    if (!user || user.deletedAt) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }
    return user;
  }

  /**
   * Converts a user entity and an optional organization into a user profile response.
   * @param user The user entity to convert.
   * @param organization The organization associated with the user, or null if none.
   * @returns The user profile response.
   */
  private toProfile(user: UserWithRelations, organization: OrganizationResponse | null): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      organization,
      role: user.role,
      timezone: user.profile?.timezone ?? "UTC",
      locale: user.profile?.locale ?? "en",
      status: user.status,
      emailVerified: user.auth?.emailVerifiedAt != null,
      mfaEnabled: user.auth?.mfaEnabled ?? false,
      lastLoginAt: user.auth?.lastLoginAt ? user.auth.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      isPlatformUser: user.isPlatformUser,
    };
  }
}