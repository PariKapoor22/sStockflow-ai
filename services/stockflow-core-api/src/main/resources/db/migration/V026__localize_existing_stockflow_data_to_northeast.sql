-- Promote the original South India prototype records to the Northeast India scenario.
-- New warehouse rows are created first so every dependent foreign key can be repointed safely.

UPDATE tenant SET tenant_name = 'NER Medical Relief Network'
WHERE tenant_id = 'TEN-ACME-PHARMA';

INSERT INTO warehouse (
    warehouse_id, tenant_id, warehouse_name, city, state, country, latitude, longitude,
    capacity_units, cold_chain_available, active, created_at, updated_at
)
SELECT 'WH-GUWAHATI', tenant_id, 'Guwahati Central Warehouse', 'Guwahati', 'Assam', country,
       26.1445000, 91.7362000, capacity_units, cold_chain_available, active, created_at, CURRENT_TIMESTAMP
FROM warehouse WHERE warehouse_id = 'WH-CHENNAI'
  AND NOT EXISTS (SELECT 1 FROM warehouse WHERE warehouse_id = 'WH-GUWAHATI');

INSERT INTO warehouse (
    warehouse_id, tenant_id, warehouse_name, city, state, country, latitude, longitude,
    capacity_units, cold_chain_available, active, created_at, updated_at
)
SELECT 'WH-SHILLONG', tenant_id, 'Shillong Relief Hub', 'Shillong', 'Meghalaya', country,
       25.5788000, 91.8933000, capacity_units, cold_chain_available, active, created_at, CURRENT_TIMESTAMP
FROM warehouse WHERE warehouse_id = 'WH-BENGALURU'
  AND NOT EXISTS (SELECT 1 FROM warehouse WHERE warehouse_id = 'WH-SHILLONG');

INSERT INTO warehouse (
    warehouse_id, tenant_id, warehouse_name, city, state, country, latitude, longitude,
    capacity_units, cold_chain_available, active, created_at, updated_at
)
SELECT 'WH-IMPHAL', tenant_id, 'Imphal Regional Hub', 'Imphal', 'Manipur', country,
       24.8170000, 93.9368000, capacity_units, cold_chain_available, active, created_at, CURRENT_TIMESTAMP
FROM warehouse WHERE warehouse_id = 'WH-HYDERABAD'
  AND NOT EXISTS (SELECT 1 FROM warehouse WHERE warehouse_id = 'WH-IMPHAL');

UPDATE batch_inventory SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE retailer SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END,
    region = 'NORTHEAST'
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');

INSERT INTO retailer (
    retailer_id, tenant_id, retailer_name, retailer_type, warehouse_id, city, region,
    credit_days, active, created_at, updated_at
)
SELECT CASE retailer_id
           WHEN 'RET-DEMO-CHENNAI' THEN 'RET-DEMO-GUWAHATI'
           WHEN 'RET-DEMO-BENGALURU' THEN 'RET-DEMO-SHILLONG'
           WHEN 'RET-DEMO-HYDERABAD' THEN 'RET-DEMO-IMPHAL'
       END,
       tenant_id, retailer_name, retailer_type, warehouse_id,
       CASE retailer_id WHEN 'RET-DEMO-CHENNAI' THEN 'Guwahati' WHEN 'RET-DEMO-BENGALURU' THEN 'Shillong' WHEN 'RET-DEMO-HYDERABAD' THEN 'Imphal' END,
       'NORTHEAST', credit_days, active, created_at, CURRENT_TIMESTAMP
FROM retailer
WHERE retailer_id IN ('RET-DEMO-CHENNAI','RET-DEMO-BENGALURU','RET-DEMO-HYDERABAD')
  AND NOT EXISTS (
      SELECT 1 FROM retailer target
      WHERE target.retailer_id = CASE retailer.retailer_id
          WHEN 'RET-DEMO-CHENNAI' THEN 'RET-DEMO-GUWAHATI'
          WHEN 'RET-DEMO-BENGALURU' THEN 'RET-DEMO-SHILLONG'
          WHEN 'RET-DEMO-HYDERABAD' THEN 'RET-DEMO-IMPHAL'
      END
  );
UPDATE sales_history SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE sales_history SET retailer_id = CASE retailer_id
    WHEN 'RET-DEMO-CHENNAI' THEN 'RET-DEMO-GUWAHATI'
    WHEN 'RET-DEMO-BENGALURU' THEN 'RET-DEMO-SHILLONG'
    WHEN 'RET-DEMO-HYDERABAD' THEN 'RET-DEMO-IMPHAL' END
WHERE retailer_id IN ('RET-DEMO-CHENNAI','RET-DEMO-BENGALURU','RET-DEMO-HYDERABAD');
UPDATE forecast_run SET requested_warehouse_id = CASE requested_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE requested_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_model_performance SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_result SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_exception SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_position_diagnostic SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE warehouse_access SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE action_proposal SET source_warehouse_id = CASE source_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE source_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE action_proposal SET destination_warehouse_id = CASE destination_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE destination_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE transfer_execution SET source_warehouse_id = CASE source_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE source_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE transfer_execution SET destination_warehouse_id = CASE destination_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE destination_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE purchase_order SET destination_warehouse_id = CASE destination_warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE destination_warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_schedule SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE forecast_job SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
UPDATE customer_order SET warehouse_id = CASE warehouse_id
    WHEN 'WH-CHENNAI' THEN 'WH-GUWAHATI' WHEN 'WH-BENGALURU' THEN 'WH-SHILLONG' WHEN 'WH-HYDERABAD' THEN 'WH-IMPHAL' END
WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');

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

DELETE FROM retailer WHERE retailer_id IN ('RET-DEMO-CHENNAI','RET-DEMO-BENGALURU','RET-DEMO-HYDERABAD');
DELETE FROM warehouse WHERE warehouse_id IN ('WH-CHENNAI','WH-BENGALURU','WH-HYDERABAD');
