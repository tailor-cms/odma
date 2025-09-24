import kebabCase from 'lodash/kebabCase';
import { registerAs } from '@nestjs/config';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export default registerAs('mikroORM', (): MikroOrmModuleSyncOptions => ({
  driver: PostgreSqlDriver,
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  highlighter: new SqlHighlighter(),
  metadataProvider: TsMorphMetadataProvider,
  seeder: {
    fileName: (className: string) => kebabCase(className),
    path: './dist/database/seeders',
    pathTs: './src/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
  },
  migrations: {
    fileName: (timestamp) => `${timestamp}-new-migration`,
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
    snapshot: true,
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    emit: 'ts',
  },
  extensions: [Migrator, SeedManager],
  pool: { min: 2, max: 10 },
  forceUtcTimezone: true,
  discovery: {
    warnWhenNoEntities: true,
    requireEntitiesArray: false,
    alwaysAnalyseProperties: true,
  },
}));
