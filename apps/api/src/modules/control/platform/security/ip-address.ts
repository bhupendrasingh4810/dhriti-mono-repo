import { isIP } from "node:net";
import { BadRequestException } from "@nestjs/common";

/** Match IPv4-mapped IPv6 and canonical IPv6 spellings using one blocklist key. */
export function canonicalIp(value: string): string {
  const version = isIP(value);
  if (!version || value.includes("%")) {
    throw new BadRequestException("A valid IP address is required");
  }
  if (version === 4) {
    return value;
  }
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([a-f0-9]+):([a-f0-9]+)$/.exec(normalized);
  if (!mapped) {
    return normalized;
  }
  const high = parseInt(mapped[1], 16);
  const low = parseInt(mapped[2], 16);
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}
