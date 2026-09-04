import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { ApiConfigService } from "./config.service";
import { validateEnv } from "./env.validation";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ConfigModule {}
