import camelCase from 'lodash/camelCase.js';

export class OpenAPIParser {
  constructor(spec) {
    this.spec = spec;
    this.schemas = spec.components?.schemas || {};
    this.paths = spec.paths || {};
  }

  getOperations() {
    const operations = [];
    for (const [path, methods] of Object.entries(this.paths)) {
      for (const [httpMethod, operation] of Object.entries(methods)) {
        if (!operation.operationId) continue;
        const parts = operation.operationId.split('_');
        if (parts.length < 2) continue;
        const namespace = camelCase(parts[0]);
        const method = camelCase(parts.slice(1).join(''));
        operations.push({
          operationId: operation.operationId,
          httpMethod: httpMethod.toUpperCase(),
          path,
          method,
          namespace,
          summary: operation.summary,
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses || {},
          operation, // Full operation object
        });
      }
    }
    return operations;
  }

  /**
   * Get all unique namespaces
   */
  getNamespaces(operations) {
    return [...new Set(operations.map((op) => op.namespace))].sort();
  }

  /**
   * Convert OpenAPI property to TypeScript type
   */
  getPropertyType(prop) {
    if (prop.$ref) return prop.$ref.split('/').pop();
    switch (prop.type) {
      case 'string':
        return prop.enum
          ? prop.enum.map((v) => `'${v}'`).join(' | ')
          : 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `Array<${this.getPropertyType(prop.items)}>`;
      case 'object':
        return 'object';
      default:
        return 'any';
    }
  }

  /**
   * Generate TypeScript interfaces from schemas
   */
  generateSchemaTypes() {
    const typeDefinitions = [];
    for (const [schemaName, schema] of Object.entries(this.schemas)) {
      if (schema.type !== 'object') continue;
      const properties = Object.entries(schema.properties || {})
        .map(([name, definition]) => {
          const isRequired = schema.required?.includes(name) ?? false;
          const optional = isRequired ? '' : '?';
          const type = this.getPropertyType(definition);
          const description = definition.description
            ? `\n  /** ${definition.description} */`
            : '';
          return `${description}\n  ${name}${optional}: ${type};`;
        })
        .join('\n');
      typeDefinitions.push(
        `\nexport interface ${schemaName} {${properties}\n}`,
      );
    }
    return typeDefinitions.join('\n');
  }

  /**
   * Extract request/response types for an operation
   */
  getOperationTypes(operation) {
    const requestParts = [];
    // Path parameters
    const pathParams = operation.parameters.filter((p) => p.in === 'path');
    if (pathParams.length > 0) {
      const pathProps = pathParams.map((p) => `${p.name}: string`).join('; ');
      requestParts.push(`path: {${pathProps}}`);
    }
    // Query parameters
    const queryParams = operation.parameters.filter((p) => p.in === 'query');
    if (queryParams.length > 0) {
      const queryProps = queryParams
        .map((p) => {
          const optional = p.required ? '' : '?';
          const type = this.getPropertyType(p.schema || { type: 'string' });
          return `${p.name}${optional}: ${type}`;
        })
        .join('; ');
      requestParts.push(`query?: {${queryProps}}`);
    }
    // Request body
    if (operation.requestBody) {
      const content = operation.requestBody.content?.['application/json'];
      if (content?.schema) {
        const bodyType = this.getPropertyType(content.schema);
        requestParts.push(`body: ${bodyType}`);
      }
    }
    let requestType = '{}';
    if (requestParts.length > 0) requestType = `{${requestParts.join('; ')}}`;
    // Response type (prefer 200/201/202)
    const responses = operation.responses;
    const successResponse =
      responses['200'] || responses['201'] || responses['202'];
    let responseType = 'any';
    if (successResponse?.content?.['application/json']?.schema) {
      responseType = this.getPropertyType(
        successResponse.content['application/json'].schema,
      );
    }
    return { requestType, responseType };
  }
}

export default OpenAPIParser;
