import { drizzle } from 'drizzle-orm/neon-http';

const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in process.env");
}

export const db = drizzle(connectionString);

