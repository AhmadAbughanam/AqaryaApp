import {execSync} from 'child_process';
import {join} from 'path';

// Mirror the URL derivation from jest-env.ts so that prisma db push targets
// the correct test database (TEST_DATABASE_URL > DATABASE_URL > default).
// globalSetup runs before setupFiles, so we cannot rely on jest-env.ts here.
const deriveTestDatabaseUrl = (): string => {
  const explicit = process.env.TEST_DATABASE_URL;
  const base =
    explicit ??
    process.env.DATABASE_URL ??
    'postgresql://aqarya:aqarya123@localhost:5434/aqarya?schema=public';

  const url = new URL(base);
  const forcedSchema = process.env.TEST_DATABASE_SCHEMA;
  if (forcedSchema) {
    url.searchParams.set('schema', forcedSchema);
  }
  return url.toString();
};

module.exports = async () => {
  const databaseUrl = deriveTestDatabaseUrl();
  execSync('npx prisma db push --skip-generate', {
    cwd: join(__dirname, '..'),
    stdio: 'inherit',
    env: {...process.env, DATABASE_URL: databaseUrl},
  });
};
