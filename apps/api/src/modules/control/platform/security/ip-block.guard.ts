import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../../../database/prisma.service";
import { canonicalIp } from "./ip-address";

@Injectable()
export class IpBlockGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    if (context.getType() !== "http") {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    // Express resolves request.ip according to the operator's trusted-proxy configuration.
    const ip = request.ip ?? request.socket.remoteAddress;
    if (!ip) {
      throw new ForbiddenException("Client IP unavailable");
    }
    const block = await this.prisma.blockedIp.findUnique({ where: { ipAddress: canonicalIp(ip) } });
    // Expiration is checked per request; enforcement never depends on a cleanup timer.
    if (block && (!block.expiresAt || block.expiresAt > new Date())) {
      throw new ForbiddenException({ code: "IP_BLOCKED", message: "Access from this IP address is blocked" });
    }
    return true;
  }
}
