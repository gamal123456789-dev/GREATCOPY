-- Migration script to add resetToken and resetTokenExpiry fields to User table
-- Run this on production database before deploying the updated schema

ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);

-- Create index for better performance on password reset lookups
CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken");

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('resetToken', 'resetTokenExpiry');