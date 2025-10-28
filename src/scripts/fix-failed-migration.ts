// Script to fix the failed migration state
// Run this with: npx ts-node src/scripts/fix-failed-migration.ts

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check the current migration status
    const migrationStatus = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250110000000_remove_unique_constraint_from_offer_name'
      ORDER BY started_at DESC 
      LIMIT 1
    `;
    
    console.log('Migration status:', migrationStatus);
    
    // Delete the failed migration record
    await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250110000000_remove_unique_constraint_from_offer_name'
    `;
    
    console.log('✓ Failed migration record removed');
    
    // Try to drop the constraint safely
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF EXISTS (
              SELECT 1 
              FROM information_schema.table_constraints 
              WHERE constraint_name = 'offers_name_key' 
              AND table_name = 'offers'
          ) THEN
              ALTER TABLE offers DROP CONSTRAINT offers_name_key;
          END IF;
      END $$;
    `;
    
    console.log('✓ Constraint removed (if it existed)');
    
    // Mark the migration as applied
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (migration_name, checksum, finished_at, started_at, applied_steps_count)
      VALUES (
        '20250110000000_remove_unique_constraint_from_offer_name',
        '', 
        NOW(),
        NOW(),
        1
      )
    `;
    
    console.log('✓ Migration marked as applied');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

