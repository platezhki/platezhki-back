-- AlterTable - Drop constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'offers_name_key' 
        AND table_name = 'offers'
    ) THEN
        ALTER TABLE "offers" DROP CONSTRAINT "offers_name_key";
    END IF;
END $$;

