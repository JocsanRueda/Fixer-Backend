import { NestFactory } from "@nestjs/core";
import { AppModule, ObserveInstrument } from "./app.module.js";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = new DocumentBuilder()
    .setTitle("Fixer API")
    .setDescription("The API description")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
