import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, 'code') === 'ENOENT';
}

/** Reads a JSON file, or returns undefined when the file does not exist yet. */
export async function readJson<Value>(path: string): Promise<Value | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Value;
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2));
}
