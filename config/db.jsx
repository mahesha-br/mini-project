import { neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Agent } from 'undici';

const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in process.env");
}

// Force IPv4 for Neon fetch requests to prevent connection timeouts on networks with unresponsive IPv6
neonConfig.fetchFunction = (url, init) => {
  return fetch(url, {
    ...init,
    dispatcher: new Agent({ connect: { family: 4 } }),
  });
};

export const db = drizzle(connectionString);

