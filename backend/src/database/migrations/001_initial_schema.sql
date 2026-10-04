-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(255),
    address TEXT,
    pincode VARCHAR(10),
    district VARCHAR(100),
    region VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    description TEXT,
    dosage_info TEXT,
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    hsn_code VARCHAR(50),
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_products_stock_qty CHECK (stock_qty >= 0),
    CONSTRAINT chk_products_category CHECK (
        category IN (
            'insecticide',
            'fungicide',
            'herbicide',
            'bactericide',
            'nematicide',
            'pgr',
            'seed',
            'fertilizer'
        )
    )
);

-- 3. orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    fulfillment_type VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    gst_invoice_no VARCHAR(100),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_orders_status CHECK (
        status IN (
            'placed',
            'confirmed',
            'packed',
            'out_for_delivery',
            'ready_for_pickup',
            'delivered',
            'picked_up',
            'cancelled'
        )
    ),
    CONSTRAINT chk_orders_fulfillment_type CHECK (
        fulfillment_type IN ('delivery', 'pickup')
    )
);

-- 4. order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 5. admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes per PRD Section 2.3
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
