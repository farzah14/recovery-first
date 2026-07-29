import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const forbiddenPatterns = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..*\.local$/,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)playwright-report\//,
  /(^|\/)test-results\//,
  /(^|\/)supabase\/\.temp\//,
  /service-account.*\.json$/,
  /\.(?:pem|p12|pfx)$/,
];

export function findForbiddenTrackedFiles(files) {
  return files.filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));
}

export function checkRepository() {
  const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
  const forbidden = findForbiddenTrackedFiles(trackedFiles);

  if (forbidden.length > 0) {
    throw new Error(`Forbidden tracked files:\n${forbidden.join('\n')}`);
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkRepository();
  process.stdout.write('Repository tracked-file policy passed.\n');
}
