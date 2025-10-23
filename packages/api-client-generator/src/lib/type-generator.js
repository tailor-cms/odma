#!/usr/bin/env node
import upperFirst from 'lodash/upperFirst.js';
import { stripIndent } from 'common-tags';

import {
  generateTypeDefinitionsHeader,
  generateBaseInterfaces,
} from './template-helpers.js';

export class TypeGenerator {
  constructor(parser) {
    this.parser = parser;
  }

  generateNamespaceInterfaces(operations, namespaces) {
    return namespaces
      .map((ns) => {
        const methods = operations.filter((op) => op.namespace === ns);
        const capitalNs = upperFirst(ns);
        const methodDefinitions = methods
          .map((op) => {
            const { requestType, responseType } =
              this.parser.getOperationTypes(op);
            return stripIndent`
              /**
               * ${op.summary || 'No description'}
               */
              ${op.method}: ApiMethod<${requestType}, ${responseType}>;`;
          })
          .join('\n');

        return stripIndent`
          export interface ${capitalNs}Namespace { ${methodDefinitions} }`;
      })
      .join('\n');
  }

  /**
   * Generate main client interface
   */
  generateMainInterface(namespaces) {
    return namespaces
      .map((ns) => `  ${ns}: ${upperFirst(ns)}Namespace;`)
      .join('\n');
  }

  /**
   * Generate client creation interfaces
   */
  generateClientCreationInterfaces() {
    return stripIndent`
      // Client creation options
      export interface CreateAcOpts {
        axiosClient: AxiosInstance;
        [key: string]: any;
      }
      export declare function createApiClient(opts: CreateAcOpts): Promise<ApiClient>;
      export default createApiClient;`;
  }

  /**
   * Generate complete TypeScript definitions
   */
  generateTypeDefinitions(operations, namespaces) {
    const schemaTypes = this.parser.generateSchemaTypes();
    const namespaceInterfaces = this.generateNamespaceInterfaces(
      operations,
      namespaces,
    );
    const mainInterface = this.generateMainInterface(namespaces);
    const baseInterfaces = generateBaseInterfaces();
    const clientCreationInterfaces = this.generateClientCreationInterfaces();

    return stripIndent`
      ${generateTypeDefinitionsHeader()}

      // Auto-generated schema types from OpenAPI spec${schemaTypes}
      ${baseInterfaces}

      // Namespace interfaces
      ${namespaceInterfaces}

      // Main client interface
      export interface ApiClient extends ResponseHelpers {
        ${mainInterface}
        _axiosClient: AxiosInstance;
      }
      ${clientCreationInterfaces}`;
  }
}

export default TypeGenerator;
