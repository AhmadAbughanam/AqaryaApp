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
  // Keep each test PrismaClient's pool small so multiple suites don't exhaust
  // Postgres max_connections even if an app close is delayed.
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', '3');
  }
  return url.toString();
};

process.env.DATABASE_URL = deriveTestDatabaseUrl();
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';
