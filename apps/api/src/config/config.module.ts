import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { ApiConfigService } from "./config.service";
import { validateEnv } from "./env.validation";
import { SecretEncryptionService } from "../common/crypto/secret-encryption.service";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],
  providers: [ApiConfigService, SecretEncryptionService],
  exports: [ApiConfigService, SecretEncryptionService],
})
export class ConfigModule {}
