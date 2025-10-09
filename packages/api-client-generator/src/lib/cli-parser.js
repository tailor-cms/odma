import minimist from 'minimist';
import { stripIndent } from 'common-tags';

/**
 * CLI argument parser using minimist
 */
export class CliParser {
  constructor(argv = process.argv.slice(2)) {
    this.argv = argv;
    this.args = this.parse();
  }

  parse() {
    const parsed = minimist(this.argv, {
      string: ['spec', 'output', 'config'],
      boolean: ['help', 'verbose'],
      alias: {
        s: 'spec',
        o: 'output',
        c: 'config',
        h: 'help',
        v: 'verbose',
      },
      default: {
        help: false,
        verbose: false,
        spec: null,
        output: null,
        config: null,
      },
    });

    return {
      spec: parsed.spec,
      output: parsed.output,
      config: parsed.config,
      help: parsed.help,
      verbose: parsed.verbose,
    };
  }

  /**
   * Get parsed arguments
   */
  getArgs() {
    return this.args;
  }

  /**
   * Check if help was requested
   */
  shouldShowHelp() {
    return this.args.help;
  }

  printHelp(commandName = 'api-client-generator') {
    console.log(stripIndent`
      Usage: ${commandName} [options]
      Generate API client from OpenAPI specification
      Options:
        -s, --spec <path>     Path to OpenAPI spec file (JSON)
                              Default: auto-detected from monorepo structure

        -o, --output <path>   Output directory for generated client
                              Default: packages/app-api-client

        -c, --config <path>   Path to configuration file
                              Default: built-in configuration

        -v, --verbose         Enable verbose output

        -h, --help           Show this help message

      Examples:
        ${commandName}
        ${commandName} --spec ./custom-spec.json
        ${commandName} --spec=./custom-spec.json
        ${commandName} --spec ./spec.json --output ./generated-client
        ${commandName} --verbose

      Environment:
        The generator automatically detects the monorepo root using package.json
        and resolves paths relative to that root unless absolute paths are
        provided.
    `);
  }
}

/**
 * Create CLI parser instance
 */
export function createCliParser(argv) {
  return new CliParser(argv);
}

export default CliParser;
