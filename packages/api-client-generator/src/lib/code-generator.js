import { stripIndent } from 'common-tags';
import {
  generateResponseHelpers,
  generateAxiosMethod,
  generateClientHeader,
  generateNamespaceInitializers,
} from './template-helpers.js';

export class CodeGenerator {
  constructor(parser) {
    this.parser = parser;
  }

  generateAxiosMethods(operations) {
    return operations.map((op) => generateAxiosMethod(op)).join('\n');
  }

  generateClientCode(operations, namespaces) {
    const header = generateClientHeader();
    const nsInitializers = generateNamespaceInitializers(namespaces);
    const axiosMethods = this.generateAxiosMethods(operations);
    const responseHelpers = generateResponseHelpers();

    return stripIndent`
      ${header}

      export async function createApiClient(opts = {}) {
        const { axiosClient, ...otherOpts } = opts;

        if (!axiosClient) {
          throw new Error('axiosClient is required for API client');
        }

        ${responseHelpers}

        // Initialize namespace groups
        const index = {
          ${nsInitializers}${nsInitializers ? ',' : ''}
          _axiosClient: axiosClient,
          extractData,
          extractFullResponse,
          extractPaginationMeta
        };

        // Generate axios-based methods
        ${axiosMethods}
        return index;
      }

      export default createApiClient;`;
  }
}

export default CodeGenerator;
