import fs from 'fs';
import path from 'path';

import { findUpSync } from 'find-up';

type Config = {
  workspaceSlug: string;
  workspaceAccessKey: string;
  newFilenameTemplate: string;
  docsDirs: string[];
};

export function loadConfig(): Config {
  const emptyConfig: Config = {
    workspaceSlug: '',
    workspaceAccessKey: '',
    newFilenameTemplate: '',
    docsDirs: [],
  };

  const dir = findUpSync('.hackersheet', { cwd: process.cwd(), type: 'directory' });
  if (!dir) return emptyConfig;

  const file = path.join(dir, 'cli.config.json');
  if (!fs.existsSync(file)) return emptyConfig;

  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
