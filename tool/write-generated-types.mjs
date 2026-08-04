import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const generated = execSync('pnpm db:types', {
  encoding: 'utf8',
  shell: true,
})
  .replace(/\r\n/g, '\n')
  .replace(/\n+$/, '\n');

writeFileSync('src/lib/supabase/database.types.ts', generated, 'utf8');
