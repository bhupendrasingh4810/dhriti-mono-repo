import { HttpStatus, Injectable } from "@nestjs/common";
import {
  Prisma,
  type HrmsEmployee,
  type User,
  type UserAuth,
  type UserProfile,
  type UserHRMSProfile,
} from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";

import type { UpdateProfileDto, UserProfileResponse } from "../dto/profile.dto";
import type { OrganizationResponse } from "../dto/auth-response.dto";

type UserWithRelations = User & {
  auth: UserAuth | null;
  profile: UserProfile | null;
  hrmsProfile: UserHRMSProfile | null;
};

const withAuthAndProfile = { auth: true, profile: true, hrmsProfile: true } as const;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the profile of the specified user.
   * @param userId The ID of the user whose profile is being retrieved.
   * @returns The user's profile information.
   * @throws AppError if the user does not exist.
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.requireUser(userId);
    const organization = await this.resolveDefaultOrganization(userId);
    const employee = organization
      ? await this.prisma.hrmsEmployee.findFirst({
          where: { userId, organizationId: organization.id, deletedAt: null },
        })
      : null;
    return this.toProfile(user, organization, employee);
  }

  /**
   * Updates the profile of the specified user.
   * @param userId The ID of the user whose profile is being updated.
   * @param dto The profile update data transfer object.
   * @returns The updated user's profile information.
   * @throws AppError if the user does not exist.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileResponse> {
    const currentUser = await this.requireUser(userId);
    if (dto.dateOfBirth && dto.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Date of birth cannot be in the future", HttpStatus.BAD_REQUEST);
    }
    const changingPhone = dto.isdCode !== undefined || dto.mobileNumber !== undefined;
    if (
      changingPhone &&
      !(
        (dto.isdCode === null && dto.mobileNumber === null) ||
        (dto.isdCode && dto.mobileNumber && `${dto.isdCode}${dto.mobileNumber}`.length <= 16)
      )
    ) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Provide both ISD code and mobile number (at most 15 digits), or clear both",
        HttpStatus.BAD_REQUEST,
      );
    }
    const profileData = {
      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
      ...(dto.prefix !== undefined ? { prefix: dto.prefix?.trim() || null } : {}),
      ...(dto.workEmail !== undefined ? { workEmail: dto.workEmail } : {}),
      ...(dto.alternateEmail !== undefined ? { alternateEmail: dto.alternateEmail } : {}),
      ...(changingPhone
        ? {
            isdCode: dto.isdCode,
            phoneNumber: dto.isdCode && dto.mobileNumber ? `${dto.isdCode}${dto.mobileNumber}` : null,
          }
        : {}),
    };
    const phoneNumberChanged = changingPhone && profileData.phoneNumber !== (currentUser.profile?.phoneNumber ?? null);
    const personalData = {
      ...(dto.dateOfBirth !== undefined
        ? {
            dateOfBirth: dto.dateOfBirth ? new Date(`${dto.dateOfBirth}T00:00:00.000Z`) : null,
            ...(dto.dateOfBirth !== (currentUser.hrmsProfile?.dateOfBirth?.toISOString().slice(0, 10) ?? null)
              ? { dateOfBirthVerified: false }
              : {}),
          }
        : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender?.trim() || null } : {}),
      ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
      ...(dto.nationality !== undefined ? { nationality: dto.nationality?.trim() || null } : {}),
    };
    try {
      await this.prisma.$transaction(async (transaction) => {
        if (dto.name !== undefined || dto.avatarUrl !== undefined) {
          await transaction.user.update({
            where: { id: userId },
            data: {
              ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
              ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
            },
          });
        }
        if (Object.keys(profileData).length) {
          await transaction.userProfile.upsert({
            where: { userId },
            create: { userId, ...profileData },
            update: profileData,
          });
        }
        if (phoneNumberChanged) {
          await transaction.userAuth.updateMany({
            where: { userId },
            data: { phoneVerifiedAt: null },
          });
        }
        if (Object.keys(personalData).length) {
          await transaction.userHRMSProfile.upsert({
            where: { userId },
            create: { userId, ...personalData },
            update: personalData,
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "This mobile number is already registered",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
    return this.getProfile(userId);
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
      where: { userId, deletedAt: null, organization: { deletedAt: null } },
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
  private toProfile(
    user: UserWithRelations,
    organization: OrganizationResponse | null,
    employee: HrmsEmployee | null,
  ): UserProfileResponse {
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
      emailVerified: Boolean(user.auth?.emailVerifiedAt),
      mfaEnabled: user.auth?.mfaEnabled ?? false,
      lastLoginAt: user.auth?.lastLoginAt ? user.auth.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      isPlatformUser: user.isPlatformUser,
      prefix: user.profile?.prefix ?? null,
      workEmail: user.profile?.workEmail ?? null,
      alternateEmail: user.profile?.alternateEmail ?? null,
      isdCode: user.profile?.isdCode ?? null,
      mobileNumber: user.profile?.phoneNumber
        ? user.profile.isdCode && user.profile.phoneNumber.startsWith(user.profile.isdCode)
          ? user.profile.phoneNumber.slice(user.profile.isdCode.length)
          : user.profile.phoneNumber
        : null,
      dateOfBirth: user.hrmsProfile?.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      gender: user.hrmsProfile?.gender ?? null,
      bloodGroup: user.hrmsProfile?.bloodGroup ?? null,
      nationality: user.hrmsProfile?.nationality ?? null,
      employeeCode: employee?.employeeNumber ?? null,
      biometricId: employee?.biometricId ?? null,
      dateOfJoining: employee?.startDate?.toISOString().slice(0, 10) ?? null,
      retirementDate: employee?.retirementDate?.toISOString().slice(0, 10) ?? null,
      dateOfResignation: employee?.resignationDate?.toISOString().slice(0, 10) ?? null,
      employmentType: employee?.employmentType ?? null,
      employmentStatus: employee?.status ?? null,
    };
  }
}
