import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[Nest] ${process.pid}  - ${timestamp}     ${level} [${context || 'Application'}] ${message}`;
            }),
          ),
        }),
      ],
    }),
  });
  app.enableCors({
    origin: '*', 
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
