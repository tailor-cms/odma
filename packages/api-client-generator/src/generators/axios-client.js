import { join, isAbsolute } from 'node:path';
import { CodeGenerator, OpenAPIParser, TypeGenerator } from '../index.js';
import {
  fileExists,
  readJsonFile,
  writeToFile,
  formatGeneratedFiles,
} from '../lib/file-utils.js';
import { getConfig } from '../lib/config.js';
import { printSuccessMessage } from '../lib/template-helpers.js';
import { resolveFromRoot } from '../lib/root-finder.js';

/**
 * Main axios client generator
 */
export class AxiosClientGenerator {
  constructor(options = {}) {
    this.options = options;
    this.config = null;
  }

  /**
   * Initialize the generator with config
   */
  async initialize() {
    const configOverrides = {};

    if (this.options.outputDir) {
      configOverrides.ClientDir = isAbsolute(this.options.outputDir)
        ? this.options.outputDir
        : await resolveFromRoot(this.options.outputDir);
    }

    if (this.options.verbose) configOverrides.Verbose = true;

    this.config = await getConfig(configOverrides);

    if (this.options.specPath) {
      this.openApiPath = isAbsolute(this.options.specPath)
        ? this.options.specPath
        : await resolveFromRoot(this.options.specPath);
    } else {
      this.openApiPath = join(this.config.ClientDir, this.config.SpecFilename);
    }

    // Log configuration if verbose
    if (this.config.Verbose) {
      console.log(this.config.Messages.RootDetected, this.config.RootDir);
      console.log(this.config.Messages.UsingSpec, this.openApiPath);
      console.log(this.config.Messages.OutputDir, this.config.ClientDir);
    }
  }

  /**
   * Validate prerequisites
   */
  validatePrerequisites() {
    if (fileExists(this.openApiPath)) return;
    console.error(this.config.Messages.SpecNotFound);
    console.error(`Spec path: ${this.openApiPath}`);
    console.error(this.config.Messages.SpecNotFoundHelp);
    process.exit(1);
  }

  /**
   * Generate the complete axios client
   */
  async generate() {
    await this.initialize();
    this.validatePrerequisites();

    try {
      console.log(this.config.Messages.Generating);

      // Parse OpenAPI spec
      const spec = await readJsonFile(this.openApiPath);
      const parser = new OpenAPIParser(spec);
      const codeGenerator = new CodeGenerator(parser);
      const typeGenerator = new TypeGenerator(parser);

      // Extract operations and namespaces
      const operations = parser.getOperations();
      const namespaces = parser.getNamespaces(operations);

      // Generate client code
      const clientCode = codeGenerator.generateClientCode(
        operations,
        namespaces,
      );

      await writeToFile(
        join(this.config.ClientDir, this.config.ClientJsFile),
        clientCode,
      );

      // Generate TypeScript definitions
      const typeDefinitions = typeGenerator.generateTypeDefinitions(
        operations,
        namespaces,
      );

      await writeToFile(
        join(this.config.ClientDir, this.config.ClientTypesFile),
        typeDefinitions,
      );

      // Format generated files
      await formatGeneratedFiles();

      // Success message
      printSuccessMessage(
        operations,
        namespaces,
        this.config.ClientDir,
        this.config,
      );
    } catch (error) {
      console.error(this.config.Messages.Error, error.message);
      process.exit(1);
    }
  }
}

/**
 * Main generation function with CLI options support
 */
export async function generateAxiosClient(options = {}) {
  const generator = new AxiosClientGenerator(options);
  await generator.generate();
}

// Run if called directly
if (process.argv[1] === import.meta.url.slice(7)) {
  generateAxiosClient();
}

export default { AxiosClientGenerator, generateAxiosClient };
