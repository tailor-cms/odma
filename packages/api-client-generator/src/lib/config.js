import { getDefaultPaths } from './root-finder.js';

// Default configuration - will be augmented with runtime paths
const DEFAULT_CONFIG = {
  // Generated files
  ClientJsFile: 'index.mjs',
  ClientTypesFile: 'index.d.ts',
  SpecFilename: 'spec.openapi.json',
  // Generation settings
  PrettierEnabled: true,
  OperationIdDelimiter: '_',
  // Messages
  Messages: {
    Generating: '🔄 Generating axios-based API client...',
    Success: '✅ Axios-based API client generated successfully!',
    Error: '❌ Error generating API client:',
    SpecNotFound: '❌ OpenAPI spec not found.',
    SpecNotFoundHelp:
      '💡 Try: --spec path/to/spec.json or generate with pnpm openapi:generate',
    Formatted: '✨ Formatted',
    FormatError: '⚠️  Could not format',
    RootDetected: '📁 Monorepo root detected:',
    UsingSpec: '📄 Using OpenAPI spec:',
    OutputDir: '📂 Output directory:',
  },
};

/**
 * Configuration class that supports runtime overrides
 */
export class Config {
  constructor() {
    this._config = { ...DEFAULT_CONFIG };
    this._initialized = false;
  }

  /**
   * Initialize config with dynamic paths and overrides
   */
  async initialize(overrides = {}) {
    if (this._initialized) return this._config;
    try {
      // Get default paths from monorepo structure
      const defaultPaths = await getDefaultPaths();
      this._config = {
        ...DEFAULT_CONFIG,
        ClientDir: defaultPaths.clientDir,
        BackendOpenApiPath: defaultPaths.backendOpenApiPath,
        RootDir: defaultPaths.root,
        ...overrides,
      };
      this._initialized = true;
      return this._config;
    } catch (error) {
      throw new Error(`Failed to initialize config: ${error.message}`);
    }
  }

  get() {
    if (!this._initialized) {
      throw new Error('Config not initialized. Call initialize() first.');
    }
    return this._config;
  }

  getValue(key) {
    return this.get()[key];
  }
}

// Singleton instance
const config = new Config();

/**
 * Initialize and get config with overrides
 */
export async function getConfig(overrides = {}) {
  return config.initialize(overrides);
}

export default config;
