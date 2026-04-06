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

process.env.DATABASE_URL = deriveTestDatabaseUrl();
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';
