import { join, isAbsolute } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { getDefaultPaths, resolveFromRoot } from '../src/lib/root-finder.js';
import { createCliParser } from '../src/lib/cli-parser.js';
import { generateAxiosClient } from '../src/index.js';

async function buildApiClient() {
  const cliParser = createCliParser();

  if (cliParser.shouldShowHelp()) {
    cliParser.printHelp('build-client');
    return;
  }

  const args = cliParser.getArgs();
  const defaultPaths = await getDefaultPaths();

  const specPath = args.spec
    ? isAbsolute(args.spec)
      ? args.spec
      : await resolveFromRoot(args.spec)
    : defaultPaths.backendOpenApiPath;

  // Check if spec exists, try to generate if not
  if (!existsSync(specPath)) {
    console.log(`📄 OpenAPI spec not found at: ${specPath}`);
    console.log('💡 Please generate openapi spec first');
    process.exit(1);
  }

  // Copy spec to target location if using default behavior
  if (!args.spec) {
    const targetDir = args.output
      ? isAbsolute(args.output)
        ? args.output
        : await resolveFromRoot(args.output)
      : defaultPaths.clientDir;

    const targetSpecPath = join(targetDir, 'spec.openapi.json');
    execSync(`cp "${specPath}" "${targetSpecPath}"`, { stdio: 'inherit' });
  }

  await generateAxiosClient({
    specPath: args.spec || join(defaultPaths.clientDir, 'spec.openapi.json'),
    outputDir: args.output,
    verbose: args.verbose,
  });
}

buildApiClient().catch((error) => {
  console.error('❌ Error building API client:', error);
  process.exit(1);
});
