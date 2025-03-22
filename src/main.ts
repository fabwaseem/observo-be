import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { SwaggerConfig } from './configs/config.interface';
import { GLOBAL_CONFIG } from './configs/global.config';
import { AllExceptionsFilter } from './filters/all.exceptions.filter';
import { InvalidFormExceptionFilter } from './filters/invalid.form.exception.filter';
import { AppModule } from './modules/app/app.module';
import { MyLogger } from './modules/logger/logger.service';
import { API_PREFIX } from './shared/constants/global.constants';
import { RateLimitGuard } from './shared/guards/rate-limit.guard';
import { SecurityInterceptor } from './shared/interceptors/security.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'error', 'warn'],
  });

  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost)),
    new InvalidFormExceptionFilter(),
  );

  // Enable CORS with strict options
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    maxAge: 3600,
  });

  // Add Helmet middleware for security headers
  app.use(helmet());

  // Add global security interceptor
  app.useGlobalInterceptors(new SecurityInterceptor());

  // Add global rate limiting
  app.useGlobalGuards(new RateLimitGuard());

  // Global validation pipe with concise error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const formatError = (error: ValidationError): string[] => {
          const messages: string[] = [];

          if (error.constraints) {
            // Get only the first constraint message for each property
            const message = Object.values(error.constraints)[0];
            messages.push(message);
          }

          if (error.children?.length) {
            error.children.forEach((child) => {
              messages.push(...formatError(child));
            });
          }

          return messages;
        };

        const errorMessages = errors.map(formatError).flat();
        const message = errorMessages.join('. ');

        return new BadRequestException({
          message: message.charAt(0).toUpperCase() + message.slice(1),
          statusCode: 400,
        });
      },
    }),
  );

  // Enable cookie parser
  app.use(cookieParser());

  const configService = app.get<ConfigService>(ConfigService);
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

  // Swagger Api
  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Nestjs')
      .setDescription(swaggerConfig.description || 'The nestjs API description')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
  }

  const PORT = process.env.PORT || GLOBAL_CONFIG.nest.port;
  await app.listen(PORT, async () => {
    const myLogger = await app.resolve(MyLogger);
    myLogger.log(`Server started listening: ${PORT}`);
  });
}
bootstrap();
