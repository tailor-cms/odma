import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { watch } from 'chokidar';
import debounce from 'lodash/debounce.js';

import { createCliParser } from '../src/lib/cli-parser.js';
import { getConfig } from '../src/lib/config.js';
import { resolveFromRoot } from '../src/lib/root-finder.js';

let isGenerating = false;
let config;
let cliArgs;
let specPath;

async function generateClient() {
  if (isGenerating) {
    console.log('⏳ Generation already in progress, skipping...');
    return;
  }
  isGenerating = true;
  console.log('🔄 Regenerating API client...');

  // Use the root package.json script
  const process = spawn('pnpm', ['api:client:build'], {
    stdio: 'inherit',
    shell: true,
    cwd: config.RootDir,
  });

  return new Promise((resolve) => {
    process.on('close', (code) => {
      isGenerating = false;
      if (code === 0) {
        console.log('✅ API client regenerated successfully');
      } else {
        console.error('❌ Failed to regenerate API client');
      }
      resolve();
    });
  });
}

// Main function
async function watchApiClient() {
  const cliParser = createCliParser();
  if (cliParser.shouldShowHelp()) {
    cliParser.printHelp('watch-client');
    return;
  }

  cliArgs = cliParser.getArgs();

  // Initialize config to get paths
  const configOverrides = {};
  if (cliArgs.output) {
    configOverrides.ClientDir = isAbsolute(cliArgs.output)
      ? cliArgs.output
      : await resolveFromRoot(cliArgs.output);
  }
  config = await getConfig(configOverrides);

  // Determine spec path to watch
  if (cliArgs.spec) {
    specPath = isAbsolute(cliArgs.spec)
      ? cliArgs.spec
      : await resolveFromRoot(cliArgs.spec);
  } else {
    // Use default spec path or backend generated spec
    specPath = config.BackendOpenApiPath;
  }

  // Debounce to avoid multiple rapid regenerations
  const debouncedRegenerate = debounce(generateClient, 1000);

  console.log('🚀 Starting API client watcher...');
  console.log(`📁 Monorepo root: ${config.RootDir}`);
  console.log(`👀 Watching OpenAPI spec: ${specPath}`);
  console.log(`📂 Output directory: ${config.ClientDir}`);
  console.log('');

  const watcher = watch(specPath, {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('change', () => {
      console.log(`📝 OpenAPI spec changed: ${specPath}`);
      debouncedRegenerate();
    })
    .on('add', () => {
      console.log(`➕ OpenAPI spec created: ${specPath}`);
      debouncedRegenerate();
    })
    .on('unlink', () => {
      console.log(`➖ OpenAPI spec removed: ${specPath}`);
      console.log('⚠️  API client generation stopped - spec file missing');
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping API client watcher...');
    watcher.close();
    process.exit(0);
  });
}

// Run the watcher
watchApiClient().catch((error) => {
  console.error('❌ Error starting watcher:', error.message);
  process.exit(1);
});
