// Simple Node.js script to fix the database
// Run this on your server: node fix-constraint.js

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fix() {
  try {
    console.log('Removing unique constraint from offers.name...');
    
    // Try dropping the constraint with different possible names
    const constraints = [
      'offers_name_key',
      'offers_name_unique',
      'name_unique',
    ];
    
    for (const constraint of constraints) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE offers DROP CONSTRAINT IF EXISTS ${constraint};`);
        console.log(`✓ Attempted to drop constraint: ${constraint}`);
      } catch (err) {
        console.log(`  Constraint ${constraint} not found or already removed`);
      }
    }
    
    // Also try to drop the unique index if it exists
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS offers_name_key;`);
      console.log('✓ Checked for index');
    } catch (err) {
      console.log('  No index to remove');
    }
    
    console.log('\n✅ Process complete!');
    console.log('\nPlease restart your server now.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nError details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();

