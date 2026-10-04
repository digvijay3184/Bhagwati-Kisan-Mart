-- Bhagwati Kisan Mart - Initial Seed Data for Mumbai Instance
-- 1. Admin Users
INSERT INTO admin_users (id, name, phone_number, role, created_at)
VALUES 
  ('ae8023ae-8b86-4de7-bdf6-ea5a5cc192b6', 'Digvijay Singh (Store Owner)', '+917983636796', 'owner', NOW()),
  ('e4a7ba1b-17e0-4410-a154-f3f8284b36b1', 'सूरज सिंह', '+919811223344', 'staff', NOW())
ON CONFLICT (phone_number) DO NOTHING;

-- 2. Core Seed Products
INSERT INTO products (id, name, category, brand, description, dosage_info, price, mrp, stock_qty, hsn_code, gst_rate, image_urls, is_active)
VALUES
  (
    'eeea0795-c12c-4540-be0e-2f609aef26bf',
    'Chlorpyrifos 20% EC',
    'insecticide',
    'Tata Rallis',
    'Broad-spectrum organophosphate insecticide for soil and foliar pests',
    '2-3 ml per liter of water',
    450.00,
    500.00,
    50,
    '380891',
    18.00,
    ARRAY['https://placehold.co/400x400/png?text=Chlorpyrifos'],
    true
  ),
  (
    'c5e3d13c-96c2-4ba0-9afb-f750c10c4807',
    'Urea Fertilizer 45kg Neem Coated',
    'fertilizer',
    'IFFCO',
    'Standard nitrogenous fertilizer essential for vegetative crop growth',
    '45kg per acre as basal/top dressing',
    266.50,
    266.50,
    150,
    '31021000',
    5.00,
    ARRAY['https://placehold.co/400x400/png?text=IFFCO+Urea'],
    true
  ),
  (
    '096d8db3-044e-49b0-b582-c5826c90b012',
    'Indofil M-45 Mancozeb 75% WP',
    'fungicide',
    'Indofil',
    'Broad spectrum contact fungicide for blast, blight, and leaf spot control',
    '2g per liter of water',
    380.00,
    440.00,
    75,
    '380892',
    18.00,
    ARRAY['https://placehold.co/400x400/png?text=Mancozeb+M45'],
    true
  ),
  (
    '3f0bfd08-52ed-4367-a134-b6375dea35b7',
    'Roundup Glyphosate 41% SL',
    'herbicide',
    'Bayer',
    'Non-selective systemic herbicide for annual and perennial weed control',
    '8-10ml per liter of water',
    520.00,
    600.00,
    35,
    '380893',
    18.00,
    ARRAY['https://placehold.co/400x400/png?text=Roundup'],
    true
  ),
  (
    '32e06afb-7c5b-46b7-91dd-01c76b82a3fa',
    'Wheat Seed HD-3086 (10 kg)',
    'seed',
    'NSC',
    'High-yielding, timely-sown wheat variety suited to the North-Western Plains zone.',
    'Seed rate approx. 40 kg per acre; sow in November',
    1820.00,
    2100.00,
    100,
    '10019100',
    0.00,
    ARRAY['https://placehold.co/600x600/png?text=Wheat+Seed'],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  stock_qty = EXCLUDED.stock_qty,
  price = EXCLUDED.price;
