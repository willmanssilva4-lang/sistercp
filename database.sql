-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'STOCKIST');
CREATE TYPE unit_type AS ENUM ('UN', 'KG', 'L', 'CX', 'PCT');
CREATE TYPE payment_method AS ENUM ('CASH', 'CREDIT', 'DEBIT', 'PIX', 'FIADO');
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'PENDING', 'CANCELED');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE transaction_status AS ENUM ('PAID', 'PENDING');
CREATE TYPE stock_movement_type AS ENUM ('ENTRY', 'EXIT');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    supplier TEXT,
    unit unit_type NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    retail_price NUMERIC(10, 2) NOT NULL,
    wholesale_price NUMERIC(10, 2) NOT NULL,
    wholesale_min_qty NUMERIC(10, 3) NOT NULL,
    stock NUMERIC(10, 3) NOT NULL DEFAULT 0,
    min_stock NUMERIC(10, 3) NOT NULL DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cashier_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    total NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status sale_status NOT NULL DEFAULT 'COMPLETED'
);

-- Sale Items Table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    qty NUMERIC(10, 3) NOT NULL,
    applied_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    description TEXT NOT NULL,
    status transaction_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Items Table (for expenses/purchases)
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    qty NUMERIC(10, 3) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL
);

-- Promotions Table
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SIMPLE_DISCOUNT',
    product_id UUID REFERENCES products(id),
    promotional_price NUMERIC(10, 2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Product Kits Table
CREATE TABLE product_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Product Kit Items Table
CREATE TABLE product_kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID REFERENCES product_kits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    qty NUMERIC(10, 3) NOT NULL
);

-- Stock Movements Table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    type stock_movement_type NOT NULL,
    qty NUMERIC(10, 3) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL
);
