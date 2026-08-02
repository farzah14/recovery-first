import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const trackedPath = 'src/lib/supabase/database.types.ts';
const temporaryPath = join(tmpdir(), `recovery-first-database-types-${process.pid}.ts`);

try {
  const generated = execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['db:types'], {
    encoding: 'utf8',
  });

  writeFileSync(temporaryPath, generated, 'utf8');
  const tracked = readFileSync(trackedPath, 'utf8');

  if (tracked !== generated) {
    console.error('Generated Supabase types are stale. Run: pnpm db:types:write');
    process.exitCode = 1;
  } else {
    process.stdout.write('Generated Supabase types match the local schema.\n');
  }
} finally {
  rmSync(temporaryPath, { force: true });
}
