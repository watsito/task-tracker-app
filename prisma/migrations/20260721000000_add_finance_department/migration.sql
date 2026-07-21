DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Department'
      AND e.enumlabel = 'FINANCE'
  ) THEN
    ALTER TYPE "Department" ADD VALUE 'FINANCE';
  END IF;
END $$;
