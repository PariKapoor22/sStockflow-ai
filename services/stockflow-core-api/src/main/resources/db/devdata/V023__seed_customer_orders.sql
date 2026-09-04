-- Persist the representative Orders workspace records in development and test
-- databases. The Angular board can therefore load details, retain lifecycle
-- history, and advance every actionable card through the real API.
INSERT INTO app_user (user_id, email, display_name)
VALUES ('local-prototype-user', 'prototype@stockflow.local', 'Local prototype user');

INSERT INTO customer_order (
    order_id, tenant_id, order_number, customer_name, customer_city, channel,
    warehouse_id, status, promised_at, fulfilment_percent, total_value,
    currency, idempotency_key, created_by, created_at, updated_at
) VALUES
    ('10842000-0000-0000-0000-000000000001', 'TEN-ACME-PHARMA', 'SO-10842', 'Lotus Care Pharmacy', 'Chennai', 'B2B Portal',
     'WH-CHENNAI', 'READY_TO_SHIP', TIMESTAMP '2026-08-27 16:00:00', 100, 68420.0000,
     'INR', 'seed-order-so-10842', 'local-prototype-user', TIMESTAMP '2026-08-25 09:00:00', TIMESTAMP '2026-08-26 12:20:00'),
    ('10841000-0000-0000-0000-000000000002', 'TEN-ACME-PHARMA', 'SO-10841', 'GreenCross Medicals', 'Bengaluru', 'EDI',
     'WH-BENGALURU', 'PICKING', TIMESTAMP '2026-08-27 18:30:00', 86, 42180.0000,
     'INR', 'seed-order-so-10841', 'local-prototype-user', TIMESTAMP '2026-08-25 09:30:00', TIMESTAMP '2026-08-26 11:45:00'),
    ('10840000-0000-0000-0000-000000000003', 'TEN-ACME-PHARMA', 'SO-10840', 'City Health Mart', 'Hyderabad', 'Sales desk',
     'WH-HYDERABAD', 'ALLOCATED', TIMESTAMP '2026-08-28 10:00:00', 64, 116750.0000,
     'INR', 'seed-order-so-10840', 'local-prototype-user', TIMESTAMP '2026-08-26 08:15:00', TIMESTAMP '2026-08-26 08:15:00'),
    ('10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', 'SO-10839', 'MediPoint Stores', 'Chennai', 'B2B Portal',
     'WH-CHENNAI', 'SHIPPED', TIMESTAMP '2026-08-26 14:00:00', 100, 27990.0000,
     'INR', 'seed-order-so-10839', 'local-prototype-user', TIMESTAMP '2026-08-24 10:00:00', TIMESTAMP '2026-08-26 13:35:00'),
    ('10838000-0000-0000-0000-000000000005', 'TEN-ACME-PHARMA', 'SO-10838', 'Aarogya Distributors', 'Hyderabad', 'API',
     'WH-HYDERABAD', 'ON_HOLD', TIMESTAMP '2026-08-28 12:00:00', 38, 53760.0000,
     'INR', 'seed-order-so-10838', 'local-prototype-user', TIMESTAMP '2026-08-25 14:10:00', TIMESTAMP '2026-08-26 10:05:00');

INSERT INTO customer_order_line (
    line_id, order_id, tenant_id, sku_id, ordered_quantity, unit_price, line_value
) VALUES
    ('10842000-1000-0000-0000-000000000001', '10842000-0000-0000-0000-000000000001', 'TEN-ACME-PHARMA', 'SKU-PARA-650', 14, 4887.1429, 68420.0000),
    ('10841000-1000-0000-0000-000000000002', '10841000-0000-0000-0000-000000000002', 'TEN-ACME-PHARMA', 'SKU-PARA-650', 8, 5272.5000, 42180.0000),
    ('10840000-1000-0000-0000-000000000003', '10840000-0000-0000-0000-000000000003', 'TEN-ACME-PHARMA', 'SKU-PARA-650', 22, 5306.8182, 116750.0000),
    ('10839000-1000-0000-0000-000000000004', '10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', 'SKU-PARA-650', 6, 4665.0000, 27990.0000),
    ('10838000-1000-0000-0000-000000000005', '10838000-0000-0000-0000-000000000005', 'TEN-ACME-PHARMA', 'SKU-PARA-650', 11, 4887.2727, 53760.0000);

INSERT INTO customer_order_event (
    event_id, order_id, tenant_id, from_status, to_status, changed_by, comment, occurred_at
) VALUES
    ('10842000-2000-0000-0000-000000000001', '10842000-0000-0000-0000-000000000001', 'TEN-ACME-PHARMA', NULL, 'ALLOCATED', 'local-prototype-user', 'Inventory allocated at Chennai Regional Warehouse', TIMESTAMP '2026-08-25 09:00:00'),
    ('10842000-2000-0000-0000-000000000002', '10842000-0000-0000-0000-000000000001', 'TEN-ACME-PHARMA', 'ALLOCATED', 'PICKING', 'local-prototype-user', 'Warehouse picking started', TIMESTAMP '2026-08-26 09:10:00'),
    ('10842000-2000-0000-0000-000000000003', '10842000-0000-0000-0000-000000000001', 'TEN-ACME-PHARMA', 'PICKING', 'READY_TO_SHIP', 'local-prototype-user', 'Order packed and moved to dispatch queue', TIMESTAMP '2026-08-26 12:20:00'),
    ('10841000-2000-0000-0000-000000000004', '10841000-0000-0000-0000-000000000002', 'TEN-ACME-PHARMA', NULL, 'ALLOCATED', 'local-prototype-user', 'Inventory allocated at Bengaluru Regional Warehouse', TIMESTAMP '2026-08-25 09:30:00'),
    ('10841000-2000-0000-0000-000000000005', '10841000-0000-0000-0000-000000000002', 'TEN-ACME-PHARMA', 'ALLOCATED', 'PICKING', 'local-prototype-user', 'Picking wave released', TIMESTAMP '2026-08-26 11:45:00'),
    ('10840000-2000-0000-0000-000000000006', '10840000-0000-0000-0000-000000000003', 'TEN-ACME-PHARMA', NULL, 'ALLOCATED', 'local-prototype-user', 'Order created and inventory secured', TIMESTAMP '2026-08-26 08:15:00'),
    ('10839000-2000-0000-0000-000000000007', '10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', NULL, 'ALLOCATED', 'local-prototype-user', 'Order created', TIMESTAMP '2026-08-24 10:00:00'),
    ('10839000-2000-0000-0000-000000000008', '10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', 'ALLOCATED', 'PICKING', 'local-prototype-user', 'Picking completed', TIMESTAMP '2026-08-25 09:00:00'),
    ('10839000-2000-0000-0000-000000000009', '10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', 'PICKING', 'READY_TO_SHIP', 'local-prototype-user', 'Ready for carrier handoff', TIMESTAMP '2026-08-26 11:00:00'),
    ('10839000-2000-0000-0000-000000000010', '10839000-0000-0000-0000-000000000004', 'TEN-ACME-PHARMA', 'READY_TO_SHIP', 'SHIPPED', 'local-prototype-user', 'Shipment confirmed', TIMESTAMP '2026-08-26 13:35:00'),
    ('10838000-2000-0000-0000-000000000011', '10838000-0000-0000-0000-000000000005', 'TEN-ACME-PHARMA', NULL, 'ALLOCATED', 'local-prototype-user', 'Order created', TIMESTAMP '2026-08-25 14:10:00'),
    ('10838000-2000-0000-0000-000000000012', '10838000-0000-0000-0000-000000000005', 'TEN-ACME-PHARMA', 'ALLOCATED', 'ON_HOLD', 'local-prototype-user', 'Customer address confirmation required', TIMESTAMP '2026-08-26 10:05:00');
