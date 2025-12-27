-- Script compatível com MySQL

-- Users Table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- UUIDs gerados pela aplicação ou UUID() no MySQL 8+
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'CASHIER', 'STOCKIST') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    brand VARCHAR(255),
    supplier VARCHAR(255),
    unit ENUM('UN', 'KG', 'L', 'CX', 'PCT') NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    retail_price DECIMAL(10, 2) NOT NULL,
    wholesale_price DECIMAL(10, 2) NOT NULL,
    wholesale_min_qty DECIMAL(10, 3) NOT NULL,
    stock DECIMAL(10, 3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10, 3) NOT NULL DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id CHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cashier_id CHAR(36),
    customer_name VARCHAR(255),
    total DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('CASH', 'CREDIT', 'DEBIT', 'PIX', 'FIADO') NOT NULL,
    status ENUM('COMPLETED', 'PENDING', 'CANCELED') NOT NULL DEFAULT 'COMPLETED',
    FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- Sale Items Table
CREATE TABLE sale_items (
    id CHAR(36) PRIMARY KEY,
    sale_id CHAR(36),
    product_id CHAR(36),
    qty DECIMAL(10, 3) NOT NULL,
    applied_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Transactions Table
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY,
    type ENUM('INCOME', 'EXPENSE') NOT NULL,
    category VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    description TEXT NOT NULL,
    status ENUM('PAID', 'PENDING') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Items Table
CREATE TABLE transaction_items (
    id CHAR(36) PRIMARY KEY,
    transaction_id CHAR(36),
    product_id CHAR(36),
    qty DECIMAL(10, 3) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Promotions Table
CREATE TABLE promotions (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SIMPLE_DISCOUNT',
    product_id CHAR(36),
    promotional_price DECIMAL(10, 2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Product Kits Table
CREATE TABLE product_kits (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Product Kit Items Table
CREATE TABLE product_kit_items (
    id CHAR(36) PRIMARY KEY,
    kit_id CHAR(36),
    product_id CHAR(36),
    qty DECIMAL(10, 3) NOT NULL,
    FOREIGN KEY (kit_id) REFERENCES product_kits(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Stock Movements Table
CREATE TABLE stock_movements (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36),
    type ENUM('ENTRY', 'EXIT') NOT NULL,
    qty DECIMAL(10, 3) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
