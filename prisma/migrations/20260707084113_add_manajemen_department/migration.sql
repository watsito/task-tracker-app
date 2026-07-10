DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Department'
      AND e.enumlabel = 'MANAJEMEN'
  ) THEN
    ALTER TYPE "Department" RENAME VALUE 'MANAJEMEN' TO 'MANAGEMENT';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Department'
      AND e.enumlabel = 'MANAGEMENT'
  ) THEN
    ALTER TYPE "Department" ADD VALUE 'MANAGEMENT';
  END IF;
END $$;
