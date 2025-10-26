import fs from 'fs/promises';
import path from 'path';

import { input, select } from '@inquirer/prompts';
import mustache from 'mustache';

import { findProjectRootPath } from '../utils/find-project-root-path';
import { loadConfig } from '../utils/load-config';

export async function newAction() {
  const config = loadConfig();
  const projectRootPath = findProjectRootPath() || process.cwd();
  const title = (await input({ message: 'Enter title' })) as string;
  const dir = await select({
    message: 'Select directory',
    default: config.docsDirs.length > 0 ? config.docsDirs[config.docsDirs.length - 1] : undefined,
    choices:
      config.docsDirs.length > 0
        ? config.docsDirs.map((d) => ({ name: d, value: d }))
        : [{ name: 'docs', value: 'docs' }],
  });
  const filenameTitle = title.replace(/[\s\u3000]+/g, '-');
  const filename = mustache.render(config.newFilenameTemplate, {
    yyyy: new Date().getFullYear().toString(),
    mm: String(new Date().getMonth() + 1).padStart(2, '0'),
    dd: String(new Date().getDate()).padStart(2, '0'),
    title: filenameTitle,
  });
  const filepath = path.join(projectRootPath, dir, filename);
  const dirPath = path.dirname(filepath);

  await fs.mkdir(dirPath, { recursive: true });

  const possibleTemplates: string[] = [];
  if (config.newFileTemplatePath) {
    const candidate = path.isAbsolute(config.newFileTemplatePath)
      ? config.newFileTemplatePath
      : path.join(projectRootPath, config.newFileTemplatePath);
    possibleTemplates.push(candidate);
  }

  const yyyy = new Date().getFullYear().toString();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const dd = String(new Date().getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;
  const _now = new Date();
  const _pad2 = (n: number) => String(n).padStart(2, '0');
  const datetime = `${_now.getFullYear()}-${_pad2(_now.getMonth() + 1)}-${_pad2(
    _now.getDate()
  )} ${_pad2(_now.getHours())}:${_pad2(_now.getMinutes())}:${_pad2(_now.getSeconds())}`;

  let rendered: string | null = null;
  let usedTemplatePath: string | null = null;
  for (const p of possibleTemplates) {
    try {
      const buf = await fs.readFile(p, { encoding: 'utf8' });
      rendered = mustache.render(buf, { yyyy, mm, dd, title, date, datetime });
      usedTemplatePath = p;
      break;
    } catch {
      // missing file: try next
    }
  }

  if (rendered === null) {
    rendered = '';
  }

  try {
    await fs.writeFile(filepath, rendered, { encoding: 'utf8', flag: 'wx' });
    console.log(`Created file: ${filepath}${usedTemplatePath ? ` (from ${usedTemplatePath})` : ''}`);
  } catch (err: unknown) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === 'EEXIST') {
      console.error(`File already exists: ${filepath}`);
    } else {
      throw err;
    }
  }
}
