import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appDir = resolve(__dirname, '../');

async function inviteAdmin() {
  const argv = minimist(process.argv.slice(2));
  const { email } = argv;

  if (!email || !email.includes('@')) {
    console.error('❌ email arg is required and must be a valid email');
    console.log('Usage: pnpm invite:admin --email user@example.com');
    process.exit(1);
  }

  console.log(`🔄 Inviting admin user: ${email}...`);

  try {
    const { AppModule } = await import(join(appDir, 'dist/src/app.module.js'));
    const { NestFactory } = await import('@nestjs/core');
    const { MikroORM, RequestContext } = await import('@mikro-orm/core');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    });
    const { UserService } = await import(
      join(appDir, 'dist/src/modules/user/user.service.js')
    );
    const { UserRole } = await import(
      join(appDir, 'dist/src/database/entities/index.js')
    );
    const userService = app.get(UserService);
    const orm = app.get(MikroORM);
    const user = await RequestContext.create(orm.em, async () => {
      return await userService.create({
        email,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      });
    });
    console.log('✅ Admin user invited successfully');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Invitation email sent`);
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inviting admin:', error.message);
    if (error.response) console.error('Error details:', error.response);
    console.log('💡 Make sure the backend is built first: pnpm build');
    console.log('💡 Usage: pnpm invite:admin --email user@example.com');
    process.exit(1);
  }
}

inviteAdmin();
