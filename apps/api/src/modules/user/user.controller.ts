import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { PlatformRoles } from "../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../common/guards/platform-roles.guard";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UserService, type UserDetail, type UserSummary } from "./user.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(PlatformRolesGuard)
// @PlatformRoles("SUPER_ADMIN", "SUPPORT", "SECURITY", "ORG_ADMIN")
@Controller("users")
export class UserController {
	constructor(private readonly users: UserService) {}

	@Get()
	@ApiOperation({ summary: "List active users" })
	async findAll(): Promise<UserSummary[]> {
		return this.users.findAllActiveUsers();
	}

	@Post()
	@ApiOperation({ summary: "Provision a pending user account" })
	async create(@Body() dto: CreateUserDto): Promise<UserDetail> {
		return this.users.createUser(dto);
	}

	@Get(":userId")
	@ApiOperation({ summary: "Get an active user's account details" })
	async findOne(@Param("userId") userId: string): Promise<UserDetail> {
		return this.users.findActiveUserById(userId);
	}

	@Patch(":userId")
	@ApiOperation({ summary: "Update a user's account details" })
	async update(
		@Param("userId") userId: string,
		@Body() dto: UpdateUserDto,
	): Promise<UserDetail> {
		return this.users.updateUser(userId, dto);
	}

	@Delete(":userId")
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: "Soft-delete a user and revoke active sessions" })
	async remove(@Param("userId") userId: string): Promise<void> {
		return this.users.deleteUser(userId);
	}

}
