import { findForbiddenTrackedFiles } from '../../../tool/check-repository.mjs';

describe('findForbiddenTrackedFiles', () => {
  it('identifies secrets and generated output', () => {
    expect(
      findForbiddenTrackedFiles([
        'src/app/page.tsx',
        '.env.local',
        '.next/server/app.js',
        'credentials.pem',
      ]),
    ).toEqual(['.env.local', '.next/server/app.js', 'credentials.pem']);
  });

  it('allows source and example configuration', () => {
    expect(findForbiddenTrackedFiles(['src/app/page.tsx', '.env.example'])).toEqual([]);
  });
});
