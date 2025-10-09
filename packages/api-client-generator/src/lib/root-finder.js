import { dirname, isAbsolute, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { packageUp } from 'package-up';

/**
 * Dynamic root finder using package-up
 */
export class RootFinder {
  constructor() {
    this._cache = null;
  }

  /**
   * Find the monorepo root directory
   */
  async findRoot(startDir = process.cwd()) {
    if (this._cache) return this._cache;
    try {
      let currentDir = startDir;
      let isRootFound = null;
      while (!isRootFound) {
        const pkgPath = await packageUp({ cwd: currentDir });
        if (!pkgPath) throw new Error(`Could not find package.json in parent`);
        const rootDir = dirname(pkgPath);
        const isMonorepo = existsSync(join(rootDir, 'pnpm-workspace.yaml'));
        if (isMonorepo) {
          isRootFound = rootDir;
          break;
        }
        // Move up one level and try again
        const parentDir = dirname(rootDir);
        if (parentDir === rootDir) {
          // We've reached the filesystem root
          // Fall back to the first package.json we found
          console.warn(
            `⚠️  Warning: Monorepo structure not detected, using: ${rootDir}`,
          );
          isRootFound = rootDir;
          break;
        }
        currentDir = parentDir;
      }
      this._cache = isRootFound;
      return isRootFound;
    } catch (error) {
      throw new Error(`Failed to find monorepo root: ${error.message}`);
    }
  }

  /**
   * Resolve a path relative to the monorepo root
   */
  async resolvePath(relativePath, startDir = process.cwd()) {
    if (isAbsolute(relativePath)) return relativePath;
    const root = await this.findRoot(startDir);
    return resolve(root, relativePath);
  }

  /**
   * Get default paths based on monorepo structure
   */
  async getDefaultPaths(startDir = process.cwd()) {
    const root = await this.findRoot(startDir);
    return {
      root,
      clientDir: join(root, 'packages/app-api-client'),
      backendOpenApiPath: join(root, 'apps/backend/openapi.json'),
    };
  }
}

// Singleton instance
const rootFinder = new RootFinder();

/**
 * Resolve path relative to monorepo root
 */
export async function resolveFromRoot(relativePath, startDir) {
  return rootFinder.resolvePath(relativePath, startDir);
}

/**
 * Get default paths for the monorepo
 */
export async function getDefaultPaths(startDir) {
  return rootFinder.getDefaultPaths(startDir);
}

export default RootFinder;
