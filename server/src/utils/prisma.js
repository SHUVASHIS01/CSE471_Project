/**
 * Prisma Client Utility
 *
 * Simplified version that uses fallback JSON data reliably.
 * MongoDB connection via Prisma 7 requires complex adapter setup,
 * so we're using JSON fallback for demonstration purposes.
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let prisma = null;

/**
 * For this implementation, we're using fallback JSON data
 * instead of live database connection to keep things simple
 * and working out of the box.
 */
const initializePrisma = () => {
  console.log(
    "ℹ️  Using fallback JSON data (MongoDB connection disabled for simplicity)",
  );
  return null;
};

prisma = initializePrisma();

/**
 * Get Prisma client instance
 * @returns {PrismaClient|null} Prisma client instance or null
 */
export const getPrismaClient = () => prisma;

/**
 * Check if Prisma client is available
 * @returns {boolean} True if Prisma client is available
 */
export const isPrismaAvailable = () => prisma !== null;

/**
 * Close Prisma connection
 */
export const closePrisma = async () => {
  console.log("📴 Database connection closed");
};

export default prisma;
