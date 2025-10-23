import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import prettier from 'prettier';

import Config from './config.js';

// Thin wrappers for future enhancements
export function fileExists(filePath) {
  return existsSync(filePath);
}

export async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeToFile(filePath, content) {
  await writeFile(filePath, content);
}

export async function formatGeneratedFiles() {
  if (!Config.PrettierEnabled) return;
  const files = [
    join(Config.ClientDir, Config.ClientJsFile),
    join(Config.ClientDir, Config.ClientTypesFile),
  ];
  for (const filepath of files) {
    if (!fileExists(filepath)) continue;
    try {
      const content = await readFile(filepath, 'utf-8');
      const formatted = await prettier.format(content, {
        filepath,
        ...(await prettier.resolveConfig(filepath)),
      });
      await writeFile(filepath, formatted);
      console.log(`${Config.Messages.Formatted} ${filepath}`);
    } catch (err) {
      console.error(`${Config.Messages.FormatError} ${filepath}:`, err.message);
    }
  }
}

export default {
  fileExists,
  readJsonFile,
  writeToFile,
  formatGeneratedFiles,
};
