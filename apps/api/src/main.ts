// Tracing must initialize before any instrumented library is loaded.
import "./tracing";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { ApiConfigService } from "./config/config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get(ApiConfigService);

  if (config.trustProxy) {app.set("trust proxy", 1);}
  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  });

  app.setGlobalPrefix(config.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
    }),
  );
  app.enableShutdownHooks();

  if (!config.isProduction) {
    const document = new DocumentBuilder()
      .setTitle("Dhriti API")
      .setDescription("Enterprise work operating system API")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, document);
    SwaggerModule.setup(`${config.apiPrefix}/docs`, app, documentFactory);
  }

  await app.listen(config.port);

  console.log(`Application is running on: http://localhost:${config.port}`);
}

void bootstrap();
