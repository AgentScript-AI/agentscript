import path from 'path';
import { fileURLToPath } from 'url';
import { defineWorkspace } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineWorkspace([path.join(dirname, 'packages/*/vitest.config.ts')]);
