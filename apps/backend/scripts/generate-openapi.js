import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appDir = resolve(__dirname, '../');

async function generateOpenApi() {
  console.log('🔄 Generating OpenAPI specification...');

  try {
    // Import from dist (compiled) backend code
    const { AppModule } = await import(join(appDir, 'dist/src/app.module.js'));
    const { NestFactory } = await import('@nestjs/core');
    const { generateOpenApiDocument, saveOpenApiSpec } = await import(
      join(appDir, 'dist/src/utils/openapi.js')
    );
    // Create app instance for spec generation only
    const app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix('api');
    const document = generateOpenApiDocument(app);
    const isGenerated = saveOpenApiSpec(document);
    await app.close();
    if (isGenerated) {
      console.log('✅ OpenAPI specification generated successfully');
    } else {
      console.error('❌ Failed to save OpenAPI specification');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error generating OpenAPI spec:', error.message);
    console.log('💡 Make sure the backend is built first: pnpm build');
    process.exit(1);
  }
}

generateOpenApi();
