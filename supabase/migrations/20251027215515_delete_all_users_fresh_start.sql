/*
  # Delete All Users for Fresh Start

  1. Operations
    - Delete all users from auth.users table
    - This will cascade delete to user_roles and clientes due to foreign keys
    
  2. Notes
    - This is a one-time operation to clean the database
    - After this, a new superadmin will be created
*/

-- Delete all users from auth.users
-- This will cascade to user_roles and clientes
DELETE FROM auth.users;