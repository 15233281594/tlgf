// 递归检查后端所有 JavaScript 文件的语法。
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const files = [];

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await collectJavaScriptFiles(join(directory, entry.name));
      }

      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(join(directory, entry.name));
    }
  }
}

await collectJavaScriptFiles(root);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
