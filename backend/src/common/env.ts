export function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Refusing to start with an insecure default.`);
  }
  return value;
}
