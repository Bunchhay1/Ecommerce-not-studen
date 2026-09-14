import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Documentation configuration
  const config = new DocumentBuilder()
    .setTitle('Admin Service API')
    .setDescription(
      'Core #15 — Platform Administration, RBAC, Control Plane, and Downstream Orchestration Service',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Admin Dashboard', 'Executive overview metrics and daily aggregations')
    .addTag('Admin Users', 'Platform customer account management and lockouts')
    .addTag('Admin Sellers', 'Marketplace seller onboarding, approval, and commission rules')
    .addTag('Admin Catalog', 'Product catalog approvals, moderations, and category curation')
    .addTag('Admin Orders', 'Order management, administrative cancellations, and refunds')
    .addTag('Admin Inventory', 'Stock adjustments and warehouse reservations')
    .addTag('Admin Payments', 'Payment gateway oversight and dispute refunds')
    .addTag('Admin Reviews', 'Review moderation, spam protection, and flag handling')
    .addTag('Admin Promotions', 'Marketing campaigns, coupons, and discount codes')
    .addTag('Admin Notifications', 'System announcements and broadcast dispatches')
    .addTag('Admin Audit Logs', 'Immutable chronological audit trails with diffs')
    .addTag('Admin RBAC & Roles', 'Role-based access control and permission matrices')
    .addTag('Admin User Accounts', 'Internal administrative user accounts and role assignments')
    .addTag('Admin Global Search', 'Unified cross-domain search')
    .addTag('Health', 'Liveness and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT || 8015;
  await app.listen(port);
  logger.log(`Admin Service is running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/swagger-ui`);
}

bootstrap();
