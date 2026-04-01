import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Apenas em desenvolvimento: limpa o banco e executa migrations
  if (isDevelopment) {
    const dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  } else {
    // Em produção: apenas executa migrations pendentes
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Enerdata API')
    .setDescription('API para monitoramento e análise de dados de energia da EIA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
