-- Migration: Add expiry_date to transaction_items table
-- This allows tracking expiration dates for products when they are purchased

ALTER TABLE transaction_items 
ADD COLUMN expiry_date DATE;

-- Add comment to document the column
COMMENT ON COLUMN transaction_items.expiry_date IS 'Data de validade do produto registrada no momento da compra';
