import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { ApiConfigService } from "../../config/config.service";

@Injectable()
export class SecretEncryptionService {
  constructor(private readonly config: ApiConfigService) {}

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [
      "v1",
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(".");
  }

  decrypt(value: string): string {
    const [version, ivValue, tagValue, ciphertextValue] = value.split(".");
    if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) {
      throw new Error("Invalid encrypted secret");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString(
      "utf8",
    );
  }

  private key(): Buffer {
    const encoded = this.config.secretEncryptionKey;
    if (!encoded) {
      throw new Error("SECRETS_ENCRYPTION_KEY is required for encrypted secret operations");
    }
    const key = Buffer.from(encoded, "base64");
    if (key.length !== 32) {
      throw new Error("SECRETS_ENCRYPTION_KEY must decode to exactly 32 bytes");
    }
    return key;
  }
}
