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
  });
  const config = app.get(ApiConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
}

void bootstrap();
