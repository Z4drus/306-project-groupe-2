/**
 * Client Prisma pour la connexion à la base de données PostgreSQL (Neon)
 */

import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/prisma/client.ts';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  console.error('Please add DATABASE_URL to your .env file');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeon(sql);

const prisma = new PrismaClient({ adapter });

export default prisma;
