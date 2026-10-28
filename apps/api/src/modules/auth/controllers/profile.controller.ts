import {
  Body,
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  HttpStatus,
  Injectable,
  NestInterceptor,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { ApiConfigService } from "../../../config/config.service";

import { ProfileService } from "../services/profile.service";
import { UpdateProfileDto, type UserProfileResponse } from "../dto/profile.dto";

interface UploadedProfilePhoto {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const PROFILE_PHOTO_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
@Injectable()
class ProfilePhotoUploadInterceptor implements NestInterceptor {
  private readonly delegate: NestInterceptor;

  constructor(config: ApiConfigService) {
    this.delegate = new (FileInterceptor("file", {
      limits: { files: 1, fileSize: config.profilePhotoMaxSizeBytes },
    }))();
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    return this.delegate.intercept(context, next);
  }
}

@ApiTags("auth")
@Controller("auth")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly config: ApiConfigService,
  ) {}

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user profile" })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponse> {
    return this.profileService.getProfile(user.userId);
  }

  @Patch("me")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update personal details, contact information and regional preferences (employment fields are HR-managed)",
  })
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto): Promise<UserProfileResponse> {
    return this.profileService.updateProfile(user.userId, dto);
  }

  @Post("me/avatar")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upload a profile photo" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(ProfilePhotoUploadInterceptor)
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedProfilePhoto | undefined,
  ): Promise<UserProfileResponse> {
    if (!file || file.size === 0) {
      throw new AppError(ErrorCode.FILE_EMPTY, 'No profile photo provided in the "file" field', HttpStatus.BAD_REQUEST);
    }
    if (file.size > this.config.profilePhotoMaxSizeBytes) {
      throw new AppError(
        ErrorCode.FILE_TOO_LARGE,
        "Profile photo exceeds the configured size limit",
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
    if (!PROFILE_PHOTO_CONTENT_TYPES.has(file.mimetype)) {
      throw new AppError(
        ErrorCode.FILE_TYPE_NOT_ALLOWED,
        "Profile photo must be a JPEG, PNG, WebP, or GIF image",
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    return this.profileService.updateProfile(user.userId, { avatarUrl });
  }
}
