-- Localize the existing development dataset to the Northeast India SIH scenario.
-- Warehouse primary keys remain stable so previously persisted forecasts,
-- inventory and approvals retain referential integrity.
UPDATE tenant SET tenant_name = 'NER Medical Relief Network'
WHERE tenant_id = 'TEN-ACME-PHARMA';

UPDATE warehouse SET warehouse_name = 'Guwahati Central Warehouse', city = 'Guwahati', state = 'Assam', latitude = 26.1445000, longitude = 91.7362000
WHERE tenant_id = 'TEN-ACME-PHARMA' AND warehouse_id = 'WH-CHENNAI';

UPDATE warehouse SET warehouse_name = 'Shillong Relief Hub', city = 'Shillong', state = 'Meghalaya', latitude = 25.5788000, longitude = 91.8933000
WHERE tenant_id = 'TEN-ACME-PHARMA' AND warehouse_id = 'WH-BENGALURU';

UPDATE warehouse SET warehouse_name = 'Imphal Regional Hub', city = 'Imphal', state = 'Manipur', latitude = 24.8170000, longitude = 93.9368000
WHERE tenant_id = 'TEN-ACME-PHARMA' AND warehouse_id = 'WH-HYDERABAD';

UPDATE customer_order SET customer_name = 'Brahmaputra Care Pharmacy', customer_city = 'Guwahati'
WHERE tenant_id = 'TEN-ACME-PHARMA' AND order_number = 'SO-10842';
UPDATE customer_order SET customer_name = 'Pine City Medicals', customer_city = 'Shillong'
WHERE tenant_id = 'TEN-ACME-PHARMA' AND order_number = 'SO-10841';
UPDATE customer_order SET customer_name = 'Loktak Health Mart', customer_city = 'Imphal'
WHERE tenant_id = 'TEN-ACME-PHARMA' AND order_number = 'SO-10840';
UPDATE customer_order SET customer_name = 'Barak Valley Medical Stores', customer_city = 'Silchar'
WHERE tenant_id = 'TEN-ACME-PHARMA' AND order_number = 'SO-10839';
UPDATE customer_order SET customer_name = 'Highland Health Distributors', customer_city = 'Aizawl'
WHERE tenant_id = 'TEN-ACME-PHARMA' AND order_number = 'SO-10838';

UPDATE customer_order_event SET comment = 'Inventory allocated at Guwahati Central Warehouse'
WHERE event_id = '10842000-2000-0000-0000-000000000001';
UPDATE customer_order_event SET comment = 'Inventory allocated at Shillong Relief Hub'
WHERE event_id = '10841000-2000-0000-0000-000000000004';
