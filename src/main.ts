import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

function parseOrigins(input: string | undefined): (string | RegExp)[] | true {
    if (!input) return true;
    const list = input.split(',').map(v => v.trim()).filter(Boolean);
    return list.length ? list : true;
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const origins = parseOrigins(process.env.CORS_ORIGINS);
    const credentials = String(process.env.CORS_CREDENTIALS || 'false') === 'true';

    app.enableCors({
        origin: origins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Authorization',
        credentials
    });

    await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
