-- Migration: Add department column to products table
-- Date: 2026-01-02

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS department TEXT;
