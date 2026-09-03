import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import helmet from 'helmet';
import {AppModule} from './app.module';

function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function trustProxySetting(): boolean | number | string {
  const value = (process.env.TRUST_PROXY ?? 'loopback').trim();
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  const hopCount = Number(value);
  return Number.isInteger(hopCount) && hopCount >= 0 ? hopCount : value;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.set('trust proxy', trustProxySetting());
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(helmet());
  app.enableShutdownHooks();

  const origins = allowedOrigins();
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });
  } else if (process.env.NODE_ENV !== 'production') {
    app.enableCors({origin: ['http://localhost:5173', 'http://127.0.0.1:5173']});
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
