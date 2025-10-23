import { defineConfig } from '@mikro-orm/libsql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { User } from '../src/database/entities';

export default defineConfig({
  dbName: ':memory:',
  entities: [User],
  entitiesTs: [User],
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
    snapshot: false,
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    emit: 'ts',
  },
  seeder: {
    path: './dist/database/seeders',
    pathTs: './src/database/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
  },
  extensions: [Migrator, SeedManager],
  forceUtcTimezone: true,
  allowGlobalContext: true,
  discovery: {
    warnWhenNoEntities: false,
    requireEntitiesArray: false,
    alwaysAnalyseProperties: true,
  },
});
