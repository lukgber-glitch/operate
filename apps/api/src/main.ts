import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SentryTracingInterceptor } from './common/interceptors/sentry-tracing.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const environment = configService.get<string>('nodeEnv', 'development');

  // Security - Production-grade Helmet configuration
  const isProduction = environment === 'production';

  app.use(
    helmet({
      // Content Security Policy - API doesn't serve HTML, but add basic protection
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      // HTTP Strict Transport Security
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS Protection (legacy but still useful)
      xssFilter: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },
      // IE No Open
      ieNoOpen: true,
      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // Cross-Origin settings
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      // Permissions Policy (Feature-Policy successor)
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Enable gzip compression for responses > 1KB
  app.use(
    compression({
      threshold: 1024, // Only compress responses larger than 1KB
      level: 6, // Balanced compression level (0-9, where 9 is max compression)
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression filter function
        return compression.filter(req, res);
      },
    }),
  );

  // CORS - allow multiple origins in development
  const corsOrigin = configService.get<string>('corsOrigin', 'http://localhost:3000');
  const isDev = environment === 'development';

  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);
          // Allow any localhost port in development
          if (origin.match(/^http:\/\/localhost:\d+$/)) {
            return callback(null, true);
          }
          // Also allow the configured origin
          if (origin === corsOrigin) {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        }
      : corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Disable detailed errors in production for security
      disableErrorMessages: environment === 'production',
    }),
  );

  // Global exception filters
  // Note: Sentry filter should be registered first to capture all exceptions
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  // Note: Sentry tracing should be registered first for accurate performance monitoring
  app.useGlobalInterceptors(new SentryTracingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Operate API')
      .setDescription('AI-Powered Business Automation Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Performance', 'Performance monitoring endpoints')
      .addTag('VAT Validation', 'EU VAT number validation via VIES')
      .addTag('CRM', 'Customer relationship management')
      .addTag('Finance', 'Financial management')
      .addTag('Banking', 'Banking integration')
      .addTag('Tax', 'Tax management')
      .addTag('HR', 'Human resources')
      .addTag('Documents', 'Document management')
      .addTag('Email', 'Email management')
      .addTag('Tasks', 'Task management')
      .addTag('Automations', 'Automation workflows')
      .addTag('Insights', 'AI-powered insights')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `Swagger documentation available at http://localhost:${port}/api/docs`,
    );
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${environment}`);
  logger.log(`API Version: v1`);
  logger.log(`Compression: enabled (threshold: 1KB, level: 6)`);
  logger.log(`Performance monitoring: /api/admin/performance`);
}

bootstrap();
